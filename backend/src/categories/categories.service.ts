import {isMongoDocumentValidationError, isMongoDuplicateKeyError} from '@/common/mongo/mongo-errors';
import {getMongoValidationMessages} from '@/common/mongo/mongo-validation-error';
import {omitUndefined} from '@/common/utils/object.utils';
import {CATEGORY_MAX_DEPTH} from '@/common/validation/validation-limits';
import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CategoriesRepository, CreateCategoryInput, UpdateCategoryInput} from './categories.repository';
import {
	CategoryInheritedAttributesResponseDto,
	CategoryResponseDto,
	CategoryTreeResponseDto,
	PaginatedCategoriesResponseDto
} from './dto/category-response.dto';
import {CreateCategoryDto} from './dto/create-category.dto';
import {ListCategoriesQueryDto} from './dto/list-categories-query.dto';
import {UpdateCategoryDto} from './dto/update-category.dto';
import {CategoryAttributeDefinition, CategoryRecord} from './types/category-document.type';
import {CategoryStatus} from './types/category-status.enum';

@Injectable() export class CategoriesService
{
	constructor( private readonly categoriesRepository: CategoriesRepository ) {}

	async create( dto: CreateCategoryDto ): Promise< CategoryResponseDto >
	{
		if ( dto.status === CategoryStatus.Archived )
		{
			throw new BadRequestException( 'New category cannot be archived' );
		}

		const input = await this.buildCreateInput( dto );

		return this.withCategoryWriteErrorHandling( async () => {
			const category = await this.categoriesRepository.create( input );

			return this.toResponseDto( category );
		} );
	}

	async findPublic(
	    query: ListCategoriesQueryDto,
	    ): Promise< PaginatedCategoriesResponseDto >
	{
		return this.findMany( query, false );
	}

	async findAdmin(
	    query: ListCategoriesQueryDto,
	    ): Promise< PaginatedCategoriesResponseDto >
	{
		return this.findMany( query, true );
	}

	async findTree(): Promise< CategoryTreeResponseDto[] >
	{
		const categories = await this.categoriesRepository.findAllForTree();

		return this.buildForest( categories );
	}

	async findSubtree( id: ObjectId ): Promise< CategoryTreeResponseDto >
	{
		const root = await this.categoriesRepository.findById( id );

		if ( !root )
		{
			throw new NotFoundException( 'Category not found' );
		}

		const descendants = await this.categoriesRepository.findDescendants( id );

		const [ tree ] = this.buildForest( [ root, ...descendants ] );

		if ( !tree )
		{
			throw new NotFoundException( 'Category not found' );
		}

		return tree;
	}

	async findChildren( id: ObjectId ): Promise< CategoryResponseDto[] >
	{
		const category = await this.categoriesRepository.findById( id );

		if ( !category )
		{
			throw new NotFoundException( 'Category not found' );
		}

		const children = await this.categoriesRepository.findChildren( id );

		return children.map( ( child ) => this.toResponseDto( child ) );
	}

	async findRootChildren(): Promise< CategoryResponseDto[] >
	{
		const children = await this.categoriesRepository.findChildren( null );

		return children.map( ( child ) => this.toResponseDto( child ) );
	}

	async findInheritedAttributes(
	    id: ObjectId,
	    ): Promise< CategoryInheritedAttributesResponseDto >
	{
		const attributes = await this.getInheritedAttributeDefinitions( id );

		return {
			categoryId : id.toHexString(),
			attributes,
		};
	}

	async getInheritedAttributeDefinitions(
	    categoryId: ObjectId,
	    ): Promise< CategoryAttributeDefinition[] >
	{
		const category = await this.categoriesRepository.findById( categoryId );

		if ( !category )
		{
			throw new NotFoundException( 'Category not found' );
		}

		const ancestors = await this.categoriesRepository.findByIds(
		    category.ancestorIds,
		);

		const chain = [...ancestors, category ].sort( ( a, b ) => a.level - b.level );

		return this.mergeAttributeDefinitions( chain );
	}

	async findOnePublic( id: ObjectId ): Promise< CategoryResponseDto >
	{
		const category = await this.categoriesRepository.findById( id );

		if ( !category )
		{
			throw new NotFoundException( 'Category not found' );
		}

		return this.toResponseDto( category );
	}

	async findOneAdmin( id: ObjectId ): Promise< CategoryResponseDto >
	{
		const category = await this.categoriesRepository.findById( id, {
			includeInactive : true,
		} );

		if ( !category )
		{
			throw new NotFoundException( 'Category not found' );
		}

		return this.toResponseDto( category );
	}

	async findBySlugPublic( slug: string ): Promise< CategoryResponseDto >
	{
		const category = await this.categoriesRepository.findBySlug(
		    this.normalizeSlug( slug ),
		);

		if ( !category )
		{
			throw new NotFoundException( 'Category not found' );
		}

		return this.toResponseDto( category );
	}

	async update(
	    id: ObjectId,
	    dto: UpdateCategoryDto,
	    ): Promise< CategoryResponseDto >
	{
		const existingCategory = await this.categoriesRepository.findById( id, {
			includeInactive : true,
		} );

		if ( !existingCategory )
		{
			throw new NotFoundException( 'Category not found' );
		}

		const updateInput = await this.buildUpdateInput( existingCategory, dto );

		this.assertUpdateIsNotEmpty( updateInput );

		return this.withCategoryWriteErrorHandling( async () => {
			const updatedCategory = await this.categoriesRepository.updateById(
			    id,
			    updateInput,
			);

			if ( !updatedCategory )
			{
				throw new NotFoundException( 'Category not found' );
			}

			return this.toResponseDto( updatedCategory );
		} );
	}

	async archive( id: ObjectId ): Promise< void >
	{
		const category = await this.categoriesRepository.findById( id, {
			includeInactive : true,
		} );

		if ( !category )
		{
			throw new NotFoundException( 'Category not found' );
		}

		const children = await this.categoriesRepository.findChildren( id, {
			includeInactive : true,
		} );

		if ( children.length > 0 )
		{
			throw new ConflictException(
			    'Cannot archive a category that has child categories',
			);
		}

		if ( category.status === CategoryStatus.Archived )
		{
			return;
		}

		await this.withCategoryWriteErrorHandling( async () => {
			const archived = await this.categoriesRepository.archiveById( id );

			if ( !archived )
			{
				throw new NotFoundException( 'Category not found' );
			}
		} );
	}

	private async findMany(
	    query: ListCategoriesQueryDto,
	    includeInactive: boolean,
	    ): Promise< PaginatedCategoriesResponseDto >
	{
		const page  = query.page ?? 1;
		const limit = query.limit ?? 20;

		const parentId = query.parentId === undefined ? undefined
		                 : query.parentId === 'root'  ? null
		                                              : new ObjectId( query.parentId );

		const result = await this.categoriesRepository.findMany( {
			page,
			limit,
			search : query.search,
			status : query.status,
			parentId,
			includeInactive,
		} );

		return {
			items : result.categories.map( ( category ) => this.toResponseDto( category ) ),
			page,
			limit,
			total : result.total,
			totalPages : Math.ceil( result.total / limit ),
		};
	}

	private async buildCreateInput(
	    dto: CreateCategoryDto,
	    ): Promise< CreateCategoryInput >
	{
		const parent               = await this.resolveParent( dto.parentId );
		const attributeDefinitions = dto.attributeDefinitions ?? [];

		this.assertUniqueAttributeKeys( attributeDefinitions );

		if ( parent )
		{
			this.assertMaxDepth( parent );
			await this.assertNoInheritedAttributeKeyConflicts(
			    parent,
			    attributeDefinitions,
			);
		}

		return omitUndefined( {
			       name : dto.name,
			       slug : dto.slug ? this.normalizeSlug( dto.slug ) : this.slugify( dto.name ),
			       parentId : parent?._id,
			       ancestorIds : parent ? [...parent.ancestorIds, parent._id ] : [],
			       level : parent ? parent.level + 1 : 0,
			       description : dto.description,
			       status : dto.status ?? CategoryStatus.Active,
			       attributeDefinitions,
		       } ) as CreateCategoryInput;
	}

	private async buildUpdateInput(
	    existingCategory: CategoryRecord,
	    dto: UpdateCategoryDto,
	    ): Promise< UpdateCategoryInput >
	{
		if ( dto.attributeDefinitions !== undefined )
		{
			this.assertUniqueAttributeKeys( dto.attributeDefinitions );

			const ancestors = await this.categoriesRepository.findByIds(
			    existingCategory.ancestorIds,
			    {
				    includeInactive : true,
			    },
			);

			const inheritedKeys = new Set(
			    ancestors.flatMap(
			        ( ancestor ) => ancestor.attributeDefinitions.map( ( definition ) => definition.key ),
			        ),
			);

			for ( const definition of dto.attributeDefinitions )
			{
				if ( inheritedKeys.has( definition.key ) )
				{
					throw new ConflictException(
					    `Attribute "${definition.key}" is already defined by an ancestor category`,
					);
				}
			}
		}

		return omitUndefined( {
			name : dto.name,
			slug : dto.slug === undefined ? undefined : this.normalizeSlug( dto.slug ),
			description : dto.description,
			status : dto.status,
			attributeDefinitions : dto.attributeDefinitions,
		} );
	}

	private async resolveParent( parentId?: string ): Promise< CategoryRecord|null >
	{
		if ( parentId === undefined )
		{
			return null;
		}

		const parent = await this.categoriesRepository.findById(
		    new ObjectId( parentId ),
		);

		if ( !parent )
		{
			throw new BadRequestException( 'Parent category does not exist or is not active' );
		}

		return parent;
	}

	private assertMaxDepth( parent: CategoryRecord ): void
	{
		if ( parent.level + 1 > CATEGORY_MAX_DEPTH )
		{
			throw new BadRequestException(
			    `Category depth cannot exceed ${CATEGORY_MAX_DEPTH}`,
			);
		}
	}

	private async assertNoInheritedAttributeKeyConflicts(
	    parent: CategoryRecord,
	    attributeDefinitions: CategoryAttributeDefinition[],
	    ): Promise< void >
	{
		const inheritedDefinitions = await this.getInheritedAttributeDefinitions(
		    parent._id,
		);

		const inheritedKeys = new Set(
		    inheritedDefinitions.map( ( definition ) => definition.key ),
		);

		for ( const definition of attributeDefinitions )
		{
			if ( inheritedKeys.has( definition.key ) )
			{
				throw new ConflictException(
				    `Attribute "${definition.key}" is already defined by an ancestor category`,
				);
			}
		}
	}

	private assertUniqueAttributeKeys(
	    attributeDefinitions: CategoryAttributeDefinition[],
	    ): void
	{
		const keys = new Set< string >();

		for ( const definition of attributeDefinitions )
		{
			if ( keys.has( definition.key ) )
			{
				throw new BadRequestException(
				    `Duplicate attribute definition key "${definition.key}"`,
				);
			}

			if ( definition.min !== undefined && definition.max !== undefined && definition.min > definition.max )
			{
				throw new BadRequestException(
				    `Attribute "${definition.key}" min cannot be greater than max`,
				);
			}

			keys.add( definition.key );
		}
	}

	private mergeAttributeDefinitions(
	    categories: CategoryRecord[],
	    ): CategoryAttributeDefinition[]
	{
		const definitionsByKey = new Map< string, CategoryAttributeDefinition >();

		for ( const category of categories )
		{
			for ( const definition of category.attributeDefinitions )
			{
				if ( definitionsByKey.has( definition.key ) )
				{
					throw new ConflictException(
					    `Duplicate inherited attribute key "${definition.key}"`,
					);
				}

				definitionsByKey.set( definition.key, definition );
			}
		}

		return [...definitionsByKey.values() ];
	}

	private buildForest( categories: CategoryRecord[] ): CategoryTreeResponseDto[]
	{
		const nodesById = new Map< string, CategoryTreeResponseDto >();

		for ( const category of categories )
		{
			nodesById.set( category._id.toHexString(), {
				...this.toResponseDto( category ),
				children : [],
			} );
		}

		const roots: CategoryTreeResponseDto[] = [];

		for ( const category of categories )
		{
			const node = nodesById.get( category._id.toHexString() );

			if ( !node )
			{
				continue;
			}

			if ( !category.parentId )
			{
				roots.push( node );
				continue;
			}

			const parent = nodesById.get( category.parentId.toHexString() );

			if ( !parent )
			{
				roots.push( node );
				continue;
			}

			parent.children.push( node );
		}

		return roots;
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

	private async withCategoryWriteErrorHandling< T >(
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
				throw new ConflictException( 'Category slug is already in use' );
			}

			if ( isMongoDocumentValidationError( error ) )
			{
				throw new BadRequestException( {
					message : 'Category failed database validation',
					validationErrors : getMongoValidationMessages( error ),
				} );
			}

			throw error;
		}
	}

	private toResponseDto( category: CategoryRecord ): CategoryResponseDto
	{
		const { _id, parentId, ancestorIds, createdAt, updatedAt, archivedAt, ...categoryData } = category;

		return omitUndefined( {
			       id : _id.toHexString(),
			       ...categoryData,
			       parentId : parentId?.toHexString(),
			       ancestorIds : ancestorIds.map( ( ancestorId ) => ancestorId.toHexString() ),
			       createdAt : createdAt.toISOString(),
			       updatedAt : updatedAt.toISOString(),
			       archivedAt : archivedAt?.toISOString(),
		       } ) as CategoryResponseDto;
	}
}