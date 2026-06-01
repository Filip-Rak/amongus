import {CategoriesRepository} from '@/categories/categories.repository';
import {CategoriesService} from '@/categories/categories.service';
import {CategoryAttributeType} from '@/categories/types/category-attribute-type.enum';
import {CategoryAttributeDefinition} from '@/categories/types/category-document.type';
import {isMongoDocumentValidationError, isMongoDuplicateKeyError} from '@/common/mongo/mongo-errors';
import {getMongoValidationMessages} from '@/common/mongo/mongo-validation-error';
import {omitUndefined} from '@/common/utils/object.utils';
import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CreateProductDto} from './dto/create-product.dto';
import {ListProductsQueryDto} from './dto/list-products-query.dto';
import {
	PaginatedProductListResponseDto,
	PaginatedProductsResponseDto,
	ProductListItemResponseDto,
	ProductResponseDto
} from './dto/product-response.dto';
import {UpdateProductDto} from './dto/update-product.dto';
import {CreateProductInput, ProductsRepository, UpdateProductInput} from './products.repository';
import {ProductAttributeValue, ProductImage, ProductPrice, ProductRecord} from './types/product-document.type';
import {ProductStatus} from './types/product-status.enum';

@Injectable() export class ProductsService
{
	constructor(
	    private readonly productsRepository: ProductsRepository,
	    private readonly categoriesRepository: CategoriesRepository,
	    private readonly categoriesService: CategoriesService,
	)
	{}

	async create( dto: CreateProductDto ): Promise< ProductResponseDto >
	{
		if ( dto.status === ProductStatus.Archived )
		{
			throw new BadRequestException( 'New product cannot be archived' );
		}

		const input = await this.buildCreateInput( dto );

		return this.withProductWriteErrorHandling( async () => {
			const product = await this.productsRepository.create( input );

			return this.toResponseDto( product );
		} );
	}

	async findPublic(
	    query: ListProductsQueryDto,
	    ): Promise< PaginatedProductListResponseDto >
	{
		this.assertValidPriceRange( query );

		const page  = query.page ?? 1;
		const limit = query.limit ?? 20;

		const categoryIds = await this.resolveCategoryIdsForListing(
		    query.categoryId,
		    query.includeSubcategories,
		);

		const result = await this.productsRepository.findManyForPublicList( {
			page,
			limit,
			search : query.search,
			status : ProductStatus.Active,
			categoryIds,
			minPrice : query.minPrice,
			maxPrice : query.maxPrice,
			inStockOnly : query.inStockOnly,
			includeInactive : false,
		} );

		return {
			items : result.products.map( ( product ) => this.toListItemResponseDto( product ) ),
			page,
			limit,
			total : result.total,
			totalPages : Math.ceil( result.total / limit ),
		};
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
		const existingProduct = await this.productsRepository.findById( id, {
			includeInactive : true,
		} );

		if ( !existingProduct )
		{
			throw new NotFoundException( 'Product not found' );
		}

		const updateInput = await this.buildUpdateInput( existingProduct, dto );

		this.assertUpdateIsNotEmpty( updateInput );

		return this.withProductWriteErrorHandling( async () => {
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

		await this.withProductWriteErrorHandling( async () => {
			const archived = await this.productsRepository.archiveById( id );

			if ( !archived )
			{
				throw new NotFoundException( 'Product not found' );
			}
		} );
	}

	private async findMany(
	    query: ListProductsQueryDto,
	    includeInactive: boolean,
	    ): Promise< PaginatedProductsResponseDto >
	{
		this.assertValidPriceRange( query );

		const page  = query.page ?? 1;
		const limit = query.limit ?? 20;

		const categoryIds = await this.resolveCategoryIdsForListing(
		    query.categoryId,
		    query.includeSubcategories,
		);

		const result = await this.productsRepository.findMany( {
			page,
			limit,
			search : query.search,
			status : query.status,
			categoryIds,
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
		const attributeValues = dto.attributeValues ?? {};
		const images          = this.normalizeImages( dto.images ?? [] );
		const categoryId      = await this.resolveActiveCategoryId( dto.categoryId );

		this.assertValidAttributeValuesObject( attributeValues );
		await this.validateAttributeValues( categoryId, attributeValues );

		return {
			name : dto.name,
			slug : dto.slug ? this.normalizeSlug( dto.slug ) : this.slugify( dto.name ),
			description : dto.description,
			price : dto.price,
			stock : dto.stock,
			categoryId,
			images,
			attributeValues,
			status : dto.status ?? ProductStatus.Draft,
		};
	}

	private async buildUpdateInput(
	    existingProduct: ProductRecord,
	    dto: UpdateProductDto,
	    ): Promise< UpdateProductInput >
	{
		const images = dto.images === undefined ? undefined : this.normalizeImages( dto.images );

		const categoryId =
		    dto.categoryId === undefined ? undefined : await this.resolveActiveCategoryId( dto.categoryId );

		const effectiveCategoryId      = categoryId ?? existingProduct.categoryId;
		const effectiveAttributeValues = dto.attributeValues ?? existingProduct.attributeValues;

		this.assertValidAttributeValuesObject( effectiveAttributeValues );
		await this.validateAttributeValues(
		    effectiveCategoryId,
		    effectiveAttributeValues,
		);

		return omitUndefined( {
			name : dto.name,
			slug : dto.slug === undefined ? undefined : this.normalizeSlug( dto.slug ),
			description : dto.description,
			price : dto.price,
			stock : dto.stock,
			categoryId,
			images,
			attributeValues : dto.attributeValues,
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

	private assertUpdateIsNotEmpty( updateInput: object ): void
	{
		if ( Object.keys( updateInput ).length === 0 )
		{
			throw new BadRequestException( 'At least one field must be provided' );
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

	private async withProductWriteErrorHandling< T >(
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

			if ( isMongoDocumentValidationError( error ) )
			{
				throw new BadRequestException( {
					message : 'Product failed database validation',
					validationErrors : getMongoValidationMessages( error ),
				} );
			}

			throw error;
		}
	}

	private toResponseDto( product: ProductRecord ): ProductResponseDto
	{
		const { _id, categoryId, createdAt, updatedAt, archivedAt, ...productData } = product;

		return omitUndefined( {
			       id : _id.toHexString(),
			       ...productData,
			       categoryId : categoryId.toHexString(),
			       createdAt : createdAt.toISOString(),
			       updatedAt : updatedAt.toISOString(),
			       archivedAt : archivedAt?.toISOString(),
		       } ) as ProductResponseDto;
	}

	private async resolveActiveCategoryId( categoryId: string ): Promise< ObjectId >
	{
		const objectId = new ObjectId( categoryId );

		const category = await this.categoriesRepository.findActiveById( objectId );

		if ( !category )
		{
			throw new BadRequestException( 'Category does not exist or is not active' );
		}

		return objectId;
	}

	private async resolveCategoryIdsForListing(
	    categoryId?: string,
	    includeSubcategories?: boolean,
	    ): Promise< ObjectId[]|undefined >
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

		if ( !includeSubcategories )
		{
			return [ objectId ];
		}

		const descendants = await this.categoriesRepository.findDescendants( objectId );

		return [
			objectId,
			...descendants.map( ( descendant ) => descendant._id ),
		];
	}

	private async validateAttributeValues(
	    categoryId: ObjectId,
	    attributeValues: Record< string, ProductAttributeValue >,
	    ): Promise< void >
	{
		const definitions = await this.categoriesService.getInheritedAttributeDefinitions( categoryId );

		const definitionsByKey = new Map(
		    definitions.map( ( definition ) => [ definition.key, definition ] ),
		);

		for ( const definition of definitions )
		{
			if ( definition.isRequired && attributeValues[ definition.key ] === undefined )
			{
				throw new BadRequestException(
				    `Missing required attribute "${definition.key}"`,
				);
			}
		}

		for ( const [ key, value ] of Object.entries( attributeValues ) )
		{
			const definition = definitionsByKey.get( key );

			if ( !definition )
			{
				throw new BadRequestException(
				    `Attribute "${key}" is not defined by the product category`,
				);
			}

			this.assertAttributeValueMatchesDefinition( key, value, definition );
		}
	}

	private assertAttributeValueMatchesDefinition(
	    key: string,
	    value: ProductAttributeValue,
	    definition: CategoryAttributeDefinition,
	    ): void
	{
		switch ( definition.type )
		{
		case CategoryAttributeType.String:
			if ( typeof value !== 'string' )
			{
				throw new BadRequestException( `Attribute "${key}" must be a string` );
			}

			if ( definition.allowedValues && !definition.allowedValues.includes( value ) )
			{
				throw new BadRequestException(
				    `Attribute "${key}" must be one of: ${definition.allowedValues.join( ', ' )}`,
				);
			}

			return;

		case CategoryAttributeType.Number:
			if ( typeof value !== 'number' )
			{
				throw new BadRequestException( `Attribute "${key}" must be a number` );
			}

			if ( definition.min !== undefined && value < definition.min )
			{
				throw new BadRequestException(
				    `Attribute "${key}" must be greater than or equal to ${definition.min}`,
				);
			}

			if ( definition.max !== undefined && value > definition.max )
			{
				throw new BadRequestException(
				    `Attribute "${key}" must be less than or equal to ${definition.max}`,
				);
			}

			return;

		case CategoryAttributeType.Boolean:
			if ( typeof value !== 'boolean' )
			{
				throw new BadRequestException( `Attribute "${key}" must be a boolean` );
			}

			return;

		case CategoryAttributeType.StringArray:
			if ( !Array.isArray( value ) || !value.every( ( item ) => typeof item === 'string' ) )
			{
				throw new BadRequestException(
				    `Attribute "${key}" must be an array of strings`,
				);
			}

			if ( definition.allowedValues && value.some( ( item ) => !definition.allowedValues?.includes( item ) ) )
			{
				throw new BadRequestException(
				    `Attribute "${key}" contains unsupported values`,
				);
			}

			return;

		default: throw new BadRequestException( `Unsupported attribute type for "${key}"` );
		}
	}

	private toListItemResponseDto(
	    product: {
		    _id: ObjectId; name : string; slug : string; description : string; price : ProductPrice;
		    images?: ProductImage[];
	    },
	    ): ProductListItemResponseDto
	{
		const primaryImage = product.images?.[ 0 ];

		return {
			id : product._id.toHexString(),
			name : product.name,
			slug : product.slug,
			description : product.description,
			price : product.price,
			image : primaryImage ? {
				url : primaryImage.url,
				...( primaryImage.alt && {
					alt : primaryImage.alt,
				} ),
			}
			                     : null,
		};
	}

	private assertValidAttributeValuesObject(
	    attributeValues: Record< string, ProductAttributeValue >,
	    ): void
	{
		for ( const [ key, value ] of Object.entries( attributeValues ) )
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
}