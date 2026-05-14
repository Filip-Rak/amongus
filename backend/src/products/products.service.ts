import {CategoriesRepository} from '@/categories/categories.repository';
import {isMongoDuplicateKeyError} from '@/common/mongo/mongo-errors';
import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CreateProductDto} from './dto/create-product.dto';
import {ListProductsQueryDto} from './dto/list-products-query.dto';
import {PaginatedProductsResponseDto, ProductResponseDto} from './dto/product-response.dto';
import {UpdateProductDto} from './dto/update-product.dto';
import {CreateProductInput, ProductsRepository, UpdateProductInput} from './products.repository';
import {ProductAttributeValue, ProductImage, ProductRecord} from './types/product-document.type';
import {ProductStatus} from './types/product-status.enum';

@Injectable() export class ProductsService
{
	constructor(
	    private readonly productsRepository: ProductsRepository,
	    private readonly categoriesRepository: CategoriesRepository,
	)
	{}

	async create( dto: CreateProductDto ): Promise< ProductResponseDto >
	{
		if ( dto.status === ProductStatus.Archived )
		{
			throw new BadRequestException( 'New product cannot be archived' );
		}

		const input = await this.buildCreateInput( dto );

		return this.withDuplicateSlugHandling( async () => {
			const product = await this.productsRepository.create( input );

			return this.toResponseDto( product );
		} );
	}

	async findPublic(
	    query: ListProductsQueryDto,
	    ): Promise< PaginatedProductsResponseDto >
	{
		return this.findMany( query, false );
	}

	async findAdmin(
	    query: ListProductsQueryDto,
	    ): Promise< PaginatedProductsResponseDto >
	{
		return this.findMany( query, true );
	}

	async findOnePublic( id: ObjectId ): Promise< ProductResponseDto >
	{
		const product = await this.productsRepository.findById( id );

		if ( !product )
		{
			throw new NotFoundException( 'Product not found' );
		}

		return this.toResponseDto( product );
	}

	async findOneAdmin( id: ObjectId ): Promise< ProductResponseDto >
	{
		const product = await this.productsRepository.findById( id, {
			includeInactive : true,
		} );

		if ( !product )
		{
			throw new NotFoundException( 'Product not found' );
		}

		return this.toResponseDto( product );
	}

	async findBySlugPublic( slug: string ): Promise< ProductResponseDto >
	{
		const product = await this.productsRepository.findBySlug(
		    this.normalizeSlug( slug ),
		);

		if ( !product )
		{
			throw new NotFoundException( 'Product not found' );
		}

		return this.toResponseDto( product );
	}

	async update(
	    id: ObjectId,
	    dto: UpdateProductDto,
	    ): Promise< ProductResponseDto >
	{
		const updateInput = await this.buildUpdateInput( dto );

		if ( Object.keys( updateInput ).length === 0 )
		{
			throw new BadRequestException( 'At least one field must be provided' );
		}

		await this.findOneAdmin( id );

		return this.withDuplicateSlugHandling( async () => {
			const updatedProduct = await this.productsRepository.updateById(
			    id,
			    updateInput,
			);

			if ( !updatedProduct )
			{
				throw new NotFoundException( 'Product not found' );
			}

			return this.toResponseDto( updatedProduct );
		} );
	}

	async archive( id: ObjectId ): Promise< void >
	{
		const product = await this.productsRepository.findById( id, {
			includeInactive : true,
		} );

		if ( !product )
		{
			throw new NotFoundException( 'Product not found' );
		}

		if ( product.status === ProductStatus.Archived )
		{
			return;
		}

		const archived = await this.productsRepository.archiveById( id );

		if ( !archived )
		{
			throw new NotFoundException( 'Product not found' );
		}
	}

	private async findMany(
	    query: ListProductsQueryDto,
	    includeInactive: boolean,
	    ): Promise< PaginatedProductsResponseDto >
	{
		this.assertValidPriceRange( query );

		const page  = query.page ?? 1;
		const limit = query.limit ?? 20;

		const result = await this.productsRepository.findMany( {
			page,
			limit,
			search : query.search,
			status : query.status,
			categoryId : query.categoryId === undefined ? undefined : new ObjectId( query.categoryId ),
			minPrice : query.minPrice,
			maxPrice : query.maxPrice,
			inStockOnly : query.inStockOnly,
			includeInactive,
		} );

		return {
			items : result.products.map( ( product ) => this.toResponseDto( product ) ),
			page,
			limit,
			total : result.total,
			totalPages : Math.ceil( result.total / limit ),
		};
	}

	private async buildCreateInput(
	    dto: CreateProductDto,
	    ): Promise< CreateProductInput >
	{
		const attributes = dto.attributes ?? {};
		const images     = this.normalizeImages( dto.images ?? [] );
		const categoryId = await this.resolveActiveCategoryId( dto.categoryId );

		this.assertValidAttributes( attributes );

		return {
			name : dto.name,
			slug : dto.slug ? this.normalizeSlug( dto.slug ) : this.slugify( dto.name ),
			description : dto.description,
			price : dto.price,
			stock : dto.stock,
			categoryId,
			images,
			attributes,
			status : dto.status ?? ProductStatus.Draft,
		};
	}

	private async buildUpdateInput( dto: UpdateProductDto ): Promise< UpdateProductInput >
	{
		if ( dto.attributes !== undefined )
		{
			this.assertValidAttributes( dto.attributes );
		}

		const images = dto.images === undefined ? undefined : this.normalizeImages( dto.images );

		const categoryId =
		    dto.categoryId === undefined ? undefined : await this.resolveActiveCategoryId( dto.categoryId );

		return this.omitUndefined( {
			name : dto.name,
			slug : dto.slug === undefined ? undefined : this.normalizeSlug( dto.slug ),
			description : dto.description,
			price : dto.price,
			stock : dto.stock,
			categoryId,
			images,
			attributes : dto.attributes,
			status : dto.status,
		} );
	}

	private normalizeImages( images: ProductImage[] ): ProductImage[]
	{
		if ( images.length === 0 )
		{
			return [];
		}

		const primaryImages = images.filter( ( image ) => image.isPrimary );

		if ( primaryImages.length > 1 )
		{
			throw new BadRequestException( 'Only one image can be primary' );
		}

		if ( primaryImages.length === 1 )
		{
			return images;
		}

		return images.map( ( image, index ) => ( {
			                   ...image,
			                   isPrimary : index === 0,
		                   } ) );
	}

	private assertValidAttributes(
	    attributes: Record< string, ProductAttributeValue >,
	    ): void
	{
		for ( const [ key, value ] of Object.entries( attributes ) )
		{
			if ( !key.trim() )
			{
				throw new BadRequestException( 'Product attribute key cannot be empty' );
			}

			if ( !this.isValidAttributeValue( value ) )
			{
				throw new BadRequestException(
				    `Invalid value for product attribute "${key}"`,
				);
			}
		}
	}

	private isValidAttributeValue( value: unknown ): value is ProductAttributeValue
	{
		if ( typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' )
		{
			return true;
		}

		if ( Array.isArray( value ) )
		{
			return value.every( ( item ) => typeof item === 'string' );
		}

		return false;
	}

	private assertValidPriceRange( query: ListProductsQueryDto ): void
	{
		if ( query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice )
		{
			throw new BadRequestException( 'minPrice cannot be greater than maxPrice' );
		}
	}

	private slugify( value: string ): string
	{
		return value.trim()
		    .toLowerCase()
		    .normalize( 'NFKD' )
		    .replace( /[\u0300-\u036f]/g, '' )
		    .replace( /[^a-z0-9]+/g, '-' )
		    .replace( /^-+|-+$/g, '' )
		    .replace( /-{2,}/g, '-' );
	}

	private normalizeSlug( value: string ): string
	{
		const slug = this.slugify( value );

		if ( !slug )
		{
			throw new BadRequestException( 'Slug cannot be empty' );
		}

		return slug;
	}

	private async withDuplicateSlugHandling< T >(
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
				throw new ConflictException( 'Product slug is already in use' );
			}

			throw error;
		}
	}

	private toResponseDto( product: ProductRecord ): ProductResponseDto
	{
		const { _id, categoryId, createdAt, updatedAt, archivedAt, ...productData } = product;

		return {
			id : _id.toHexString(),
			...productData,
			...( categoryId && {
				categoryId : categoryId.toHexString(),
			} ),
			createdAt : createdAt.toISOString(),
			updatedAt : updatedAt.toISOString(),
			...( archivedAt && {
				archivedAt : archivedAt.toISOString(),
			} ),
		};
	}

	private omitUndefined< T extends object >( object: T ): Partial< T >
	{
		return Object.fromEntries(
		           Object.entries( object ).filter( ( [, value ] ) => value !== undefined ),
		           ) as Partial< T >;
	}

	private async resolveActiveCategoryId(
	    categoryId?: string,
	    ): Promise< ObjectId|undefined >
	{
		if ( categoryId === undefined )
		{
			return undefined;
		}

		const objectId = new ObjectId( categoryId );

		const category = await this.categoriesRepository.findActiveById( objectId );

		if ( !category )
		{
			throw new BadRequestException( 'Category does not exist or is not active' );
		}

		return objectId;
	}
}