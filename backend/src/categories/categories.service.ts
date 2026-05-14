import {isMongoDuplicateKeyError} from '@/common/mongo/mongo-errors';
import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CategoriesRepository, CreateCategoryInput, UpdateCategoryInput} from './categories.repository';
import {CategoryResponseDto, PaginatedCategoriesResponseDto} from './dto/category-response.dto';
import {CreateCategoryDto} from './dto/create-category.dto';
import {ListCategoriesQueryDto} from './dto/list-categories-query.dto';
import {UpdateCategoryDto} from './dto/update-category.dto';
import {CategoryRecord} from './types/category-document.type';
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

		const input = this.buildCreateInput( dto );

		return this.withDuplicateSlugHandling( async () => {
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
		const updateInput = this.buildUpdateInput( dto );

		this.assertUpdateIsNotEmpty( updateInput );

		await this.findOneAdmin( id );

		return this.withDuplicateSlugHandling( async () => {
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

		if ( category.status === CategoryStatus.Archived )
		{
			return;
		}

		const archived = await this.categoriesRepository.archiveById( id );

		if ( !archived )
		{
			throw new NotFoundException( 'Category not found' );
		}
	}

	private async findMany(
	    query: ListCategoriesQueryDto,
	    includeInactive: boolean,
	    ): Promise< PaginatedCategoriesResponseDto >
	{
		const page  = query.page ?? 1;
		const limit = query.limit ?? 20;

		const result = await this.categoriesRepository.findMany( {
			page,
			limit,
			search : query.search,
			status : query.status,
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

	private buildCreateInput( dto: CreateCategoryDto ): CreateCategoryInput
	{
		return {
			name : dto.name,
			slug : dto.slug ? this.normalizeSlug( dto.slug ) : this.slugify( dto.name ),
			description : dto.description,
			status : dto.status ?? CategoryStatus.Active,
		};
	}

	private buildUpdateInput( dto: UpdateCategoryDto ): UpdateCategoryInput
	{
		return this.omitUndefined( {
			name : dto.name,
			slug : dto.slug === undefined ? undefined : this.normalizeSlug( dto.slug ),
			description : dto.description,
			status : dto.status,
		} );
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
				throw new ConflictException( 'Category slug is already in use' );
			}

			throw error;
		}
	}

	private toResponseDto( category: CategoryRecord ): CategoryResponseDto
	{
		const { _id, createdAt, updatedAt, archivedAt, ...categoryData } = category;

		return {
			id : _id.toHexString(),
			...categoryData,
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
}