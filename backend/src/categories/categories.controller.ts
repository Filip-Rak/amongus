import {Public} from '@/auth/decorators/public.decorator';
import {Roles} from '@/auth/decorators/roles.decorator';
import {ParseObjectIdPipe} from '@/common/pipes/parse-object-id.pipe';
import {UserRole} from '@/users/types/user-role.enum';
import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CategoriesService} from './categories.service';
import {CategoryResponseDto, PaginatedCategoriesResponseDto} from './dto/category-response.dto';
import {CreateCategoryDto} from './dto/create-category.dto';
import {ListCategoriesQueryDto} from './dto/list-categories-query.dto';
import {UpdateCategoryDto} from './dto/update-category.dto';

@Controller( 'categories' ) export class CategoriesController
{
	constructor( private readonly categoriesService: CategoriesService ) {}

	@Public()
	@Get()
	findPublic(
	    @Query() query: ListCategoriesQueryDto,
	    ): Promise< PaginatedCategoriesResponseDto >
	{
		return this.categoriesService.findPublic( query );
	}

	@Get( 'admin' )
	@Roles( UserRole.Admin )
	findAdmin(
	    @Query() query: ListCategoriesQueryDto,
	    ): Promise< PaginatedCategoriesResponseDto >
	{
		return this.categoriesService.findAdmin( query );
	}

	@Get( 'admin/:id' )
	@Roles( UserRole.Admin )
	findOneAdmin(
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    ): Promise< CategoryResponseDto >
	{
		return this.categoriesService.findOneAdmin( id );
	}

	@Public()
	@Get( 'slug/:slug' )
	findBySlugPublic(
	    @Param( 'slug' ) slug: string,
	    ): Promise< CategoryResponseDto >
	{
		return this.categoriesService.findBySlugPublic( slug );
	}

	@Public()
	@Get( ':id' )
	findOnePublic(
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    ): Promise< CategoryResponseDto >
	{
		return this.categoriesService.findOnePublic( id );
	}

	@Post() @Roles( UserRole.Admin ) create( @Body() dto: CreateCategoryDto ): Promise< CategoryResponseDto >
	{
		return this.categoriesService.create( dto );
	}

	@Patch( ':id' )
	@Roles( UserRole.Admin )
	update(
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    @Body() dto: UpdateCategoryDto,
	    ): Promise< CategoryResponseDto >
	{
		return this.categoriesService.update( id, dto );
	}

	@Delete( ':id' )
	@Roles( UserRole.Admin )
	@HttpCode( HttpStatus.NO_CONTENT )
	archive( @Param( 'id', ParseObjectIdPipe ) id: ObjectId ): Promise< void >
	{
		return this.categoriesService.archive( id );
	}
}