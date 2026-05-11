import {DatabaseService} from '@/database/database.service';
import {Injectable, OnModuleInit} from '@nestjs/common';
import {Collection, Filter, ObjectId, Sort, UpdateFilter} from 'mongodb';

import {
	ProductAttributeValue,
	ProductDocument,
	ProductImage,
	ProductPrice,
	ProductRecord,
} from './types/product-document.type';
import {ProductStatus} from './types/product-status.enum';

export interface CreateProductInput {
	name: string;
	slug: string;
	description: string;
	price: ProductPrice;
	stock: number;
	images: ProductImage[];
	attributes: Record< string, ProductAttributeValue >;
	status: ProductStatus;
}

export interface UpdateProductInput {
	name?: string;
	slug?: string;
	description?: string;
	price?: ProductPrice;
	stock?: number;
	images?: ProductImage[];
	attributes?: Record< string, ProductAttributeValue >;
	status?: ProductStatus;
}

export interface FindProductsInput {
	page: number;
	limit: number;
	search?: string;
	status?: ProductStatus;
	minPrice?: number;
	maxPrice?: number;
	inStockOnly?: boolean;
	includeInactive: boolean;
}

export interface FindProductsResult {
	products: ProductRecord[];
	total: number;
}

type NumberRangeFilter = {
	$gte?: number;
	$lte?: number;
};

type ProductFindFilter = Filter< ProductDocument >&
{
	'price.amount'?: NumberRangeFilter;
};

@Injectable() export class ProductsRepository implements OnModuleInit
{
	private readonly products: Collection< ProductDocument >;

	constructor( private readonly databaseService: DatabaseService )
	{
		this.products = this.databaseService.collection< ProductDocument >( 'products' );
	}

	async onModuleInit(): Promise< void >
	{
		await this.ensureIndexes();
	}

	private async ensureIndexes(): Promise< void >
	{
		await this.products.createIndex(
		    { slug : 1 },
		    {
			    unique : true,
			    name : 'uq_products_slug',
		    },
		);

		await this.products.createIndex(
		    { status : 1, createdAt : -1 },
		    {
			    name : 'ix_products_status_created_at',
		    },
		);

		await this.products.createIndex(
		    { status : 1, 'price.amount' : 1, createdAt : -1 },
		    {
			    name : 'ix_products_status_price_created_at',
		    },
		);

		await this.products.createIndex(
		    { status : 1, stock : 1, createdAt : -1 },
		    {
			    name : 'ix_products_status_stock_created_at',
		    },
		);

		await this.products.createIndex(
		    { name : 'text', description : 'text' },
		    {
			    name : 'tx_products_name_description',
		    },
		);
	}

	async create( input: CreateProductInput ): Promise< ProductRecord >
	{
		const now = new Date();

		const document: ProductDocument = {
			name : input.name,
			slug : input.slug,
			description : input.description,
			price : input.price,
			stock : input.stock,
			images : input.images,
			attributes : input.attributes,
			status : input.status,
			createdAt : now,
			updatedAt : now,
		};

		const result = await this.products.insertOne( document );

		return {
			_id : result.insertedId,
			...document,
		};
	}

	async findMany( input: FindProductsInput ): Promise< FindProductsResult >
	{
		const filter = this.buildFindManyFilter( input );
		const sort   = this.buildFindManySort( input );
		const skip   = ( input.page - 1 ) * input.limit;

		const [ products, total ] = await Promise.all( [
			this.products.find( filter ).sort( sort ).skip( skip ).limit( input.limit ).toArray(),
			this.products.countDocuments( filter ),
		] );

		return {
			products,
			total,
		};
	}

	async findById(
	    id: ObjectId,
	    options?: { includeInactive?: boolean },
	    ): Promise< ProductRecord|null >
	{
		const filter: Filter< ProductDocument > = {
			_id : id,
		};

		if ( !options?.includeInactive )
		{
			filter.status = ProductStatus.Active;
		}

		return this.products.findOne( filter );
	}

	async findBySlug(
	    slug: string,
	    options?: { includeInactive?: boolean },
	    ): Promise< ProductRecord|null >
	{
		const filter: Filter< ProductDocument > = {
			slug,
		};

		if ( !options?.includeInactive )
		{
			filter.status = ProductStatus.Active;
		}

		return this.products.findOne( filter );
	}

	async updateById(
	    id: ObjectId,
	    input: UpdateProductInput,
	    ): Promise< ProductRecord|null >
	{
		const now = new Date();

		const $set = this.omitUndefined( {
			...input,
			updatedAt : now,
			archivedAt : input.status === ProductStatus.Archived ? now : undefined,
		} );

		const update: UpdateFilter< ProductDocument > = {
			$set,
		};

		if ( input.status !== undefined && input.status !== ProductStatus.Archived )
		{
			update.$unset = {
				archivedAt : '',
			};
		}

		return this.products.findOneAndUpdate(
		    { _id : id },
		    update,
		    {
			    returnDocument : 'after',
			    includeResultMetadata : false,
		    },
		);
	}

	async archiveById( id: ObjectId ): Promise< boolean >
	{
		const now = new Date();

		const result = await this.products.updateOne(
		    {
			    _id : id,
			    status : { $ne : ProductStatus.Archived },
		    },
		    {
			    $set : {
				    status : ProductStatus.Archived,
				    archivedAt : now,
				    updatedAt : now,
			    },
		    },
		);

		return result.modifiedCount === 1;
	}

	private buildFindManyFilter( input: FindProductsInput ): ProductFindFilter
	{
		const filter: ProductFindFilter = {};

		if ( !input.includeInactive )
		{
			filter.status = ProductStatus.Active;
		}
		else if ( input.status !== undefined )
		{
			filter.status = input.status;
		}

		if ( input.search?.trim() )
		{
			filter.$text = {
				$search : input.search.trim(),
			};
		}

		const priceFilter: NumberRangeFilter = {};

		if ( input.minPrice !== undefined )
		{
			priceFilter.$gte = input.minPrice;
		}

		if ( input.maxPrice !== undefined )
		{
			priceFilter.$lte = input.maxPrice;
		}

		if ( Object.keys( priceFilter ).length > 0 )
		{
			filter[ 'price.amount' ] = priceFilter;
		}

		if ( input.inStockOnly )
		{
			filter.stock = {
				$gt : 0,
			};
		}

		return filter;
	}

	private buildFindManySort( input: FindProductsInput ): Sort
	{
		if ( input.search?.trim() )
		{
			return {
				score : { $meta : 'textScore' },
				createdAt : -1,
			};
		}

		return {
			createdAt : -1,
		};
	}

	private omitUndefined< T extends Record< string, unknown >>( object: T ): Partial< T >
	{
		return Object.fromEntries(
		           Object.entries( object ).filter( ( [, value ] ) => value !== undefined ),
		           ) as Partial< T >;
	}
}