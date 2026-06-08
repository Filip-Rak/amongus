import {isMongoDocumentValidationError, isMongoDuplicateKeyError} from '@/common/mongo/mongo-errors';
import {getMongoValidationMessages} from '@/common/mongo/mongo-validation-error';
import {omitUndefined} from '@/common/utils/object.utils';
import {DatabaseService} from '@/database/database.service';
import {OrdersRepository} from '@/orders/orders.repository';
import {ProductsRepository} from '@/products/products.repository';
import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CreateReviewDto} from './dto/create-review.dto';
import {ListReviewsQueryDto} from './dto/list-reviews-query.dto';
import {PaginatedReviewsResponseDto, ReviewResponseDto} from './dto/review-response.dto';
import {UpdateReviewDto} from './dto/update-review.dto';
import {ReviewsRepository, UpdateReviewInput} from './reviews.repository';
import {ReviewRecord} from './types/review-document.type';

@Injectable() export class ReviewsService
{
	constructor(
	    private readonly databaseService: DatabaseService,
	    private readonly reviewsRepository: ReviewsRepository,
	    private readonly productsRepository: ProductsRepository,
	    private readonly ordersRepository: OrdersRepository,
	)
	{}

	async findByProduct(
	    productId: ObjectId,
	    query: ListReviewsQueryDto,
	    ): Promise< PaginatedReviewsResponseDto >
	{
		const product = await this.productsRepository.findActiveById( productId );

		if ( !product )
		{
			throw new NotFoundException( 'Product not found' );
		}

		const page  = query.page ?? 1;
		const limit = query.limit ?? 20;

		const result = await this.reviewsRepository.findManyByProductId( {
			productId,
			page,
			limit,
		} );

		return {
			items : result.reviews.map( ( review ) => this.toResponseDto( review ) ),
			page,
			limit,
			total : result.total,
			totalPages : Math.ceil( result.total / limit ),
		};
	}

	async findMine(
	    userId: ObjectId,
	    query: ListReviewsQueryDto,
	    ): Promise< PaginatedReviewsResponseDto >
	{
		const page  = query.page ?? 1;
		const limit = query.limit ?? 20;

		const result = await this.reviewsRepository.findManyByUserId( {
			userId,
			page,
			limit,
		} );

		return {
			items : result.reviews.map( ( review ) => this.toResponseDto( review ) ),
			page,
			limit,
			total : result.total,
			totalPages : Math.ceil( result.total / limit ),
		};
	}

	async create(
	    userId: ObjectId,
	    productId: ObjectId,
	    dto: CreateReviewDto,
	    ): Promise< ReviewResponseDto >
	{
		return this.withReviewWriteErrorHandling(
		    async () => this.databaseService.withTransaction( async ( session ) => {
			    const product = await this.productsRepository.findActiveById( productId, {
				    session,
			    } );

			    if ( !product )
			    {
				    throw new NotFoundException( 'Product not found' );
			    }

			    const order = await this.ordersRepository.findPaidOrderContainingProduct(
			        userId,
			        productId,
			        {
				        session,
			        },
			    );

			    if ( !order )
			    {
				    throw new ForbiddenException(
				        'You can review only products you have bought and paid for',
				    );
			    }

			    const review = await this.reviewsRepository.create(
			        {
				        productId,
				        userId,
				        productName : product.name,
				        rating : dto.rating,
				        title : dto.title,
				        comment : dto.comment,
			        },
			        {
				        session,
			        },
			    );

			    await this.refreshProductReviewStats( productId, {
				    session,
			    } );

			    return this.toResponseDto( review );
		    } ),
		);
	}

	async updateMine(
	    userId: ObjectId,
	    reviewId: ObjectId,
	    dto: UpdateReviewDto,
	    ): Promise< ReviewResponseDto >
	{
		const updateInput = this.buildUpdateInput( dto );

		this.assertUpdateIsNotEmpty( updateInput );

		return this.withReviewWriteErrorHandling(
		    async () => this.databaseService.withTransaction( async ( session ) => {
			    const review = await this.getReviewOrThrow( reviewId, {
				    session,
			    } );

			    this.assertReviewOwner( review, userId );

			    const updatedReview = await this.reviewsRepository.updateById(
			        reviewId,
			        updateInput,
			        {
				        session,
			        },
			    );

			    if ( !updatedReview )
			    {
				    throw new NotFoundException( 'Review not found' );
			    }

			    await this.refreshProductReviewStats( review.productId, {
				    session,
			    } );

			    return this.toResponseDto( updatedReview );
		    } ),
		);
	}

	async removeMine( userId: ObjectId, reviewId: ObjectId ): Promise< void >
	{
		await this.withReviewWriteErrorHandling(
		    async () => this.databaseService.withTransaction( async ( session ) => {
			    const review = await this.getReviewOrThrow( reviewId, {
				    session,
			    } );

			    this.assertReviewOwner( review, userId );

			    await this.softDeleteAndRefreshStats( review, {
				    session,
			    } );
		    } ),
		);
	}

	async removeAsAdmin( reviewId: ObjectId ): Promise< void >
	{
		await this.withReviewWriteErrorHandling(
		    async () => this.databaseService.withTransaction( async ( session ) => {
			    const review = await this.getReviewOrThrow( reviewId, {
				    session,
			    } );

			    await this.softDeleteAndRefreshStats( review, {
				    session,
			    } );
		    } ),
		);
	}

	private async getReviewOrThrow(
	    reviewId: ObjectId,
	    options?: { session?: import( 'mongodb' ).ClientSession },
	    ): Promise< ReviewRecord >
	{
		const review = await this.reviewsRepository.findById( reviewId, options );

		if ( !review )
		{
			throw new NotFoundException( 'Review not found' );
		}

		return review;
	}

	private assertReviewOwner( review: ReviewRecord, userId: ObjectId ): void
	{
		if ( !review.userId.equals( userId ) )
		{
			throw new ForbiddenException( 'You cannot modify this review' );
		}
	}

	private async softDeleteAndRefreshStats(
	    review: ReviewRecord,
	    options?: { session?: import( 'mongodb' ).ClientSession },
	    ): Promise< void >
	{
		const deleted = await this.reviewsRepository.softDeleteById(
		    review._id,
		    options,
		);

		if ( !deleted )
		{
			throw new NotFoundException( 'Review not found' );
		}

		await this.refreshProductReviewStats( review.productId, options );
	}

	private async refreshProductReviewStats(
	    productId: ObjectId,
	    options?: { session?: import( 'mongodb' ).ClientSession },
	    ): Promise< void >
	{
		const stats = await this.reviewsRepository.calculateStats(
		    productId,
		    options,
		);

		await this.productsRepository.updateReviewStats(
		    productId,
		    stats,
		    options,
		);
	}

	private buildUpdateInput( dto: UpdateReviewDto ): UpdateReviewInput
	{
		return omitUndefined( {
			rating : dto.rating,
			title : dto.title,
			comment : dto.comment,
		} );
	}

	private assertUpdateIsNotEmpty( updateInput: object ): void
	{
		if ( Object.keys( updateInput ).length === 0 )
		{
			throw new BadRequestException( 'At least one field must be provided' );
		}
	}

	private async withReviewWriteErrorHandling< T >(
	    operation: () => Promise< T >,
	    ): Promise< T >
	{
		try
		{
			return await operation();
		}
		catch ( error )
		{
			if ( isMongoDuplicateKeyError( error ) )
			{
				throw new ConflictException( 'You have already reviewed this product' );
			}

			if ( isMongoDocumentValidationError( error ) )
			{
				throw new BadRequestException( {
					message : 'Review failed database validation',
					validationErrors : getMongoValidationMessages( error ),
				} );
			}

			throw error;
		}
	}

	private toResponseDto( review: ReviewRecord ): ReviewResponseDto
	{
		return {
			id : review._id.toHexString(),
			productId : review.productId.toHexString(),
			userId : review.userId.toHexString(),
			productName : review.productName,
			rating : review.rating,
			...( review.title && {
				title : review.title,
			} ),
			...( review.comment && {
				comment : review.comment,
			} ),
			createdAt : review.createdAt.toISOString(),
			updatedAt : review.updatedAt.toISOString(),
			...( review.deletedAt && {
				deletedAt : review.deletedAt.toISOString(),
			} ),
		};
	}
}