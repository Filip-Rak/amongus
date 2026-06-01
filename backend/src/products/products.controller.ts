import {Public} from '@/auth/decorators/public.decorator';
import {Roles} from '@/auth/decorators/roles.decorator';
import {ParseObjectIdPipe} from '@/common/pipes/parse-object-id.pipe';
import {UserRole} from '@/users/types/user-role.enum';
import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CreateProductDto} from './dto/create-product.dto';
import {ListProductsQueryDto} from './dto/list-products-query.dto';
import {
	PaginatedProductListResponseDto,
	PaginatedProductsResponseDto,
	ProductResponseDto
} from './dto/product-response.dto';
import {UpdateProductDto} from './dto/update-product.dto';
import {ProductsService} from './products.service';

@Controller( 'products' ) export class ProductsController
{
	constructor( private readonly productsService: ProductsService ) {}

	@Public()
	@Get()
	findPublic(
	    @Query() query: ListProductsQueryDto,
	    ): Promise< PaginatedProductListResponseDto >
	{
		return this.productsService.findPublic( query );
	}

	@Get( 'admin' )
	@Roles( UserRole.Admin )
	findAdmin(
	    @Query() query: ListProductsQueryDto,
	    ): Promise< PaginatedProductsResponseDto >
	{
		return this.productsService.findAdmin( query );
	}

	@Get( 'admin/:id' )
	@Roles( UserRole.Admin )
	findOneAdmin(
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    ): Promise< ProductResponseDto >
	{
		return this.productsService.findOneAdmin( id );
	}

	@Public()
	@Get( 'slug/:slug' )
	findBySlugPublic(
	    @Param( 'slug' ) slug: string,
	    ): Promise< ProductResponseDto >
	{
		return this.productsService.findBySlugPublic( slug );
	}

	@Public()
	@Get( ':id' )
	findOnePublic(
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    ): Promise< ProductResponseDto >
	{
		return this.productsService.findOnePublic( id );
	}

	@Post() @Roles( UserRole.Admin ) create( @Body() dto: CreateProductDto ): Promise< ProductResponseDto >
	{
		return this.productsService.create( dto );
	}

	@Patch( ':id' )
	@Roles( UserRole.Admin )
	update(
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    @Body() dto: UpdateProductDto,
	    ): Promise< ProductResponseDto >
	{
		return this.productsService.update( id, dto );
	}

	@Delete( ':id' )
	@Roles( UserRole.Admin )
	@HttpCode( HttpStatus.NO_CONTENT )
	archive( @Param( 'id', ParseObjectIdPipe ) id: ObjectId ): Promise< void >
	{
		return this.productsService.archive( id );
	}
}