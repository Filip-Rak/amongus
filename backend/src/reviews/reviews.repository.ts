import {RepositoryOptions} from '@/common/types/repository-options.type';
import {DatabaseService} from '@/database/database.service';
import {Injectable, OnModuleInit} from '@nestjs/common';
import {Collection, Filter, ObjectId, UpdateFilter} from 'mongodb';

import {ReviewDocument, ReviewRecord} from './types/review-document.type';
import {ReviewStatus} from './types/review-status.enum';

export interface CreateReviewInput {
	productId: ObjectId;
	userId: ObjectId;
	orderId: ObjectId;
	productName: string;
	rating: number;
	title?: string;
	comment?: string;
}

export interface UpdateReviewInput {
	rating?: number;
	title?: string;
	comment?: string;
}

export interface FindReviewsInput {
	productId: ObjectId;
	page: number;
	limit: number;
}

export interface FindUserReviewsInput {
	userId: ObjectId;
	page: number;
	limit: number;
}

export interface FindReviewsResult {
	reviews: ReviewRecord[];
	total: number;
}

export interface ReviewStats {
	averageRating: number;
	reviewCount: number;
}

@Injectable() export class ReviewsRepository implements OnModuleInit
{
	private readonly reviews: Collection< ReviewDocument >;

	constructor( private readonly databaseService: DatabaseService )
	{
		this.reviews = this.databaseService.collection< ReviewDocument >( 'reviews' );
	}

	async onModuleInit(): Promise< void >
	{
		await this.ensureIndexes();
	}

	private async ensureIndexes(): Promise< void >
	{
		await this.reviews.createIndex(
		    {
			    productId : 1,
			    userId : 1,
		    },
		    {
			    unique : true,
			    name : 'uq_reviews_product_id_user_id_active',
			    partialFilterExpression : {
				    status : ReviewStatus.Active,
			    },
		    },
		);

		await this.reviews.createIndex(
		    {
			    productId : 1,
			    status : 1,
			    createdAt : -1,
		    },
		    {
			    name : 'ix_reviews_product_id_status_created_at',
		    },
		);

		await this.reviews.createIndex(
		    {
			    userId : 1,
			    createdAt : -1,
		    },
		    {
			    name : 'ix_reviews_user_id_created_at',
		    },
		);

		await this.reviews.createIndex(
		    {
			    orderId : 1,
		    },
		    {
			    name : 'ix_reviews_order_id',
		    },
		);
	}

	async create(
	    input: CreateReviewInput,
	    options?: RepositoryOptions,
	    ): Promise< ReviewRecord >
	{
		const now = new Date();

		const document: ReviewDocument = {
			productId : input.productId,
			userId : input.userId,
			orderId : input.orderId,
			productName : input.productName,
			rating : input.rating,
			title : input.title,
			comment : input.comment,
			status : ReviewStatus.Active,
			createdAt : now,
			updatedAt : now,
		};

		const result = await this.reviews.insertOne( document, {
			session : options?.session,
		} );

		return {
			_id : result.insertedId,
			...document,
		};
	}

	async findById(
	    id: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< ReviewRecord|null >
	{
		return this.reviews.findOne(
		    {
			    _id : id,
			    status : ReviewStatus.Active,
		    },
		    {
			    session : options?.session,
		    },
		);
	}

	async findManyByProductId(
	    input: FindReviewsInput,
	    options?: RepositoryOptions,
	    ): Promise< FindReviewsResult >
	{
		const filter: Filter< ReviewDocument > = {
			productId : input.productId,
			status : ReviewStatus.Active,
		};

		return this.findMany( filter, input.page, input.limit, options );
	}

	async findManyByUserId(
	    input: FindUserReviewsInput,
	    options?: RepositoryOptions,
	    ): Promise< FindReviewsResult >
	{
		const filter: Filter< ReviewDocument > = {
			userId : input.userId,
			status : ReviewStatus.Active,
		};

		return this.findMany( filter, input.page, input.limit, options );
	}

	async updateById(
	    id: ObjectId,
	    input: UpdateReviewInput,
	    options?: RepositoryOptions,
	    ): Promise< ReviewRecord|null >
	{
		const update: UpdateFilter< ReviewDocument > = {
			$set : {
				...input,
				updatedAt : new Date(),
			},
		};

		return this.reviews.findOneAndUpdate(
		    {
			    _id : id,
			    status : ReviewStatus.Active,
		    },
		    update,
		    {
			    session : options?.session,
			    returnDocument : 'after',
			    includeResultMetadata : false,
		    },
		);
	}

	async softDeleteById(
	    id: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< boolean >
	{
		const result = await this.reviews.updateOne(
		    {
			    _id : id,
			    status : ReviewStatus.Active,
		    },
		    {
			    $set : {
				    status : ReviewStatus.Deleted,
				    deletedAt : new Date(),
				    updatedAt : new Date(),
			    },
		    },
		    {
			    session : options?.session,
		    },
		);

		return result.modifiedCount === 1;
	}

	async calculateStats(
	    productId: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< ReviewStats >
	{
		const result = await this.reviews
		                   .aggregate< { _id : ObjectId; averageRating : number; reviewCount : number; } >(
		                       [
			                       {
				                       $match : {
					                       productId,
					                       status : ReviewStatus.Active,
				                       },
			                       },
			                       {
				                       $group : {
					                       _id : '$productId',
					                       averageRating : {
						                       $avg : '$rating',
					                       },
					                       reviewCount : {
						                       $sum : 1,
					                       },
				                       },
			                       },
		                       ],
		                       {
			                       session : options?.session,
		                       },
		                       )
		                   .toArray();

		const stats = result[ 0 ];

		if ( !stats )
		{
			return {
				averageRating : 0,
				reviewCount : 0,
			};
		}

		return {
			averageRating : Math.round( stats.averageRating * 10 ) / 10,
			reviewCount : stats.reviewCount,
		};
	}

	private async findMany(
	    filter: Filter< ReviewDocument >,
	    page: number,
	    limit: number,
	    options?: RepositoryOptions,
	    ): Promise< FindReviewsResult >
	{
		const skip = ( page - 1 ) * limit;

		const [ reviews, total ] = await Promise.all( [
			this.reviews
			    .find( filter, {
				    session : options?.session,
			    } )
			    .sort( { createdAt : -1 } )
			    .skip( skip )
			    .limit( limit )
			    .toArray(),
			this.reviews.countDocuments( filter, {
				session : options?.session,
			} ),
		] );

		return {
			reviews,
			total,
		};
	}
}