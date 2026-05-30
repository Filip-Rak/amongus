import {RepositoryOptions} from '@/common/types/repository-options.type';
import {DatabaseService} from '@/database/database.service';
import {Injectable, OnModuleInit} from '@nestjs/common';
import {Collection, Filter, ObjectId, UpdateFilter} from 'mongodb';

import {CategoryAttributeDefinition, CategoryDocument, CategoryRecord} from './types/category-document.type';
import {CategoryStatus} from './types/category-status.enum';

export interface CreateCategoryInput {
	name: string;
	slug: string;
	parentId?: ObjectId;
	ancestorIds: ObjectId[];
	level: number;
	description?: string;
	status: CategoryStatus;
	attributeDefinitions: CategoryAttributeDefinition[];
}

export interface UpdateCategoryInput {
	name?: string;
	slug?: string;
	description?: string;
	status?: CategoryStatus;
	attributeDefinitions?: CategoryAttributeDefinition[];
}

export interface FindCategoriesInput {
	page: number;
	limit: number;
	search?: string;
	status?: CategoryStatus;
	parentId?: ObjectId|null;
	includeInactive: boolean;
}

export interface FindCategoriesResult {
	categories: CategoryRecord[];
	total: number;
}

@Injectable() export class CategoriesRepository implements OnModuleInit
{
	private readonly categories: Collection< CategoryDocument >;

	constructor( private readonly databaseService: DatabaseService )
	{
		this.categories = this.databaseService.collection< CategoryDocument >( 'categories' );
	}

	async onModuleInit(): Promise< void >
	{
		await this.ensureIndexes();
	}

	async create( input: CreateCategoryInput ): Promise< CategoryRecord >
	{
		const now = new Date();

		const document: CategoryDocument = {
			name : input.name,
			slug : input.slug,
			...( input.parentId && {
				parentId : input.parentId,
			} ),
			ancestorIds : input.ancestorIds,
			level : input.level,
			...( input.description && {
				description : input.description,
			} ),
			status : input.status,
			attributeDefinitions : input.attributeDefinitions,
			createdAt : now,
			updatedAt : now,
		};

		const result = await this.categories.insertOne( document );

		return {
			_id : result.insertedId,
			...document,
		};
	}

	async findMany( input: FindCategoriesInput ): Promise< FindCategoriesResult >
	{
		const filter = this.buildFindManyFilter( input );
		const skip   = ( input.page - 1 ) * input.limit;

		const [ categories, total ] = await Promise.all( [
			this.categories.find( filter ).sort( { level : 1, name : 1 } ).skip( skip ).limit( input.limit ).toArray(),
			this.categories.countDocuments( filter ),
		] );

		return {
			categories,
			total,
		};
	}

	async findById(
	    id: ObjectId,
	    options?: RepositoryOptions&{ includeInactive?: boolean },
	    ): Promise< CategoryRecord|null >
	{
		const filter: Filter< CategoryDocument > = {
			_id : id,
		};

		if ( !options?.includeInactive )
		{
			filter.status = CategoryStatus.Active;
		}

		return this.categories.findOne( filter, {
			session : options?.session,
		} );
	}

	async findByIds(
	    ids: ObjectId[],
	    options?: RepositoryOptions&{ includeInactive?: boolean },
	    ): Promise< CategoryRecord[] >
	{
		if ( ids.length === 0 )
		{
			return [];
		}

		const filter: Filter< CategoryDocument > = {
			_id : {
				$in : ids,
			},
		};

		if ( !options?.includeInactive )
		{
			filter.status = CategoryStatus.Active;
		}

		return this.categories
		    .find( filter, {
			    session : options?.session,
		    } )
		    .sort( { level : 1 } )
		    .toArray();
	}

	async findBySlug(
	    slug: string,
	    options?: RepositoryOptions&{ includeInactive?: boolean },
	    ): Promise< CategoryRecord|null >
	{
		const filter: Filter< CategoryDocument > = {
			slug,
		};

		if ( !options?.includeInactive )
		{
			filter.status = CategoryStatus.Active;
		}

		return this.categories.findOne( filter, {
			session : options?.session,
		} );
	}

	async findActiveById(
	    id: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< CategoryRecord|null >
	{
		return this.categories.findOne(
		    {
			    _id : id,
			    status : CategoryStatus.Active,
		    },
		    {
			    session : options?.session,
		    },
		);
	}

	async findChildren(
	    parentId: ObjectId|null,
	    options?: RepositoryOptions&{ includeInactive?: boolean },
	    ): Promise< CategoryRecord[] >
	{
		const filter: Filter< CategoryDocument > =
		    parentId === null ? { parentId : { $exists : false } } : { parentId };

		if ( !options?.includeInactive )
		{
			filter.status = CategoryStatus.Active;
		}

		return this.categories
		    .find( filter, {
			    session : options?.session,
		    } )
		    .sort( { name : 1 } )
		    .toArray();
	}

	async findDescendants(
	    categoryId: ObjectId,
	    options?: RepositoryOptions&{ includeInactive?: boolean },
	    ): Promise< CategoryRecord[] >
	{
		const filter: Filter< CategoryDocument > = {
			ancestorIds : categoryId,
		};

		if ( !options?.includeInactive )
		{
			filter.status = CategoryStatus.Active;
		}

		return this.categories
		    .find( filter, {
			    session : options?.session,
		    } )
		    .sort( { level : 1, name : 1 } )
		    .toArray();
	}

	async findAllForTree(
	    options?: RepositoryOptions&{ includeInactive?: boolean },
	    ): Promise< CategoryRecord[] >
	{
		const filter: Filter< CategoryDocument > = {};

		if ( !options?.includeInactive )
		{
			filter.status = CategoryStatus.Active;
		}

		return this.categories
		    .find( filter, {
			    session : options?.session,
		    } )
		    .sort( { level : 1, name : 1 } )
		    .toArray();
	}

	async updateById(
	    id: ObjectId,
	    input: UpdateCategoryInput,
	    ): Promise< CategoryRecord|null >
	{
		const now = new Date();

		const update: UpdateFilter< CategoryDocument > = {
			$set : {
				...input,
				updatedAt : now,
			},
		};

		if ( input.status === CategoryStatus.Archived )
		{
			update.$set = {
				...update.$set,
				archivedAt : now,
			};
		}

		if ( input.status !== undefined && input.status !== CategoryStatus.Archived )
		{
			update.$unset = {
				archivedAt : '',
			};
		}

		return this.categories.findOneAndUpdate(
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

		const result = await this.categories.updateOne(
		    {
			    _id : id,
			    status : {
				    $ne : CategoryStatus.Archived,
			    },
		    },
		    {
			    $set : {
				    status : CategoryStatus.Archived,
				    archivedAt : now,
				    updatedAt : now,
			    },
		    },
		);

		return result.modifiedCount === 1;
	}

	private async ensureIndexes(): Promise< void >
	{
		await this.categories.createIndex(
		    {
			    slug : 1,
		    },
		    {
			    unique : true,
			    name : 'uq_categories_slug',
		    },
		);

		await this.categories.createIndex(
		    {
			    parentId : 1,
			    status : 1,
			    name : 1,
		    },
		    {
			    name : 'ix_categories_parent_id_status_name',
		    },
		);

		await this.categories.createIndex(
		    {
			    ancestorIds : 1,
			    status : 1,
		    },
		    {
			    name : 'ix_categories_ancestor_ids_status',
		    },
		);

		await this.categories.createIndex(
		    {
			    status : 1,
			    level : 1,
			    name : 1,
		    },
		    {
			    name : 'ix_categories_status_level_name',
		    },
		);

		await this.categories.createIndex(
		    {
			    name : 'text',
			    description : 'text',
		    },
		    {
			    name : 'tx_categories_name_description',
		    },
		);
	}

	private buildFindManyFilter(
	    input: FindCategoriesInput,
	    ): Filter< CategoryDocument >
	{
		const filter: Filter< CategoryDocument > = {};

		if ( !input.includeInactive )
		{
			filter.status = CategoryStatus.Active;
		}
		else if ( input.status )
		{
			filter.status = input.status;
		}

		if ( input.parentId !== undefined )
		{
			if ( input.parentId === null )
			{
				filter.parentId = {
					$exists : false,
				};
			}
			else
			{
				filter.parentId = input.parentId;
			}
		}

		if ( input.search?.trim() )
		{
			filter.$text = {
				$search : input.search.trim(),
			};
		}

		return filter;
	}
}