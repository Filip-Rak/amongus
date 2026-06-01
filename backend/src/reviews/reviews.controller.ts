import type {JwtUser} from '@/auth/auth.types';
import {CurrentUser} from '@/auth/decorators/current-user.decorator';
import {Public} from '@/auth/decorators/public.decorator';
import {Roles} from '@/auth/decorators/roles.decorator';
import {ParseObjectIdPipe} from '@/common/pipes/parse-object-id.pipe';
import {UserRole} from '@/users/types/user-role.enum';
import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CreateReviewDto} from './dto/create-review.dto';
import {ListReviewsQueryDto} from './dto/list-reviews-query.dto';
import {PaginatedReviewsResponseDto, ReviewResponseDto} from './dto/review-response.dto';
import {UpdateReviewDto} from './dto/update-review.dto';
import {ReviewsService} from './reviews.service';

@Controller() export class ReviewsController
{
	constructor( private readonly reviewsService: ReviewsService ) {}

	@Public()
	@Get( 'products/:productId/reviews' )
	findByProduct(
	    @Param( 'productId', ParseObjectIdPipe ) productId: ObjectId,
	    @Query() query: ListReviewsQueryDto,
	    ): Promise< PaginatedReviewsResponseDto >
	{
		return this.reviewsService.findByProduct( productId, query );
	}

	@Get( 'reviews/my' )
	@Roles( UserRole.User )
	findMine(
	    @CurrentUser() user: JwtUser,
	    @Query() query: ListReviewsQueryDto,
	    ): Promise< PaginatedReviewsResponseDto >
	{
		return this.reviewsService.findMine( new ObjectId( user.sub ), query );
	}

	@Post( 'products/:productId/reviews' )
	@Roles( UserRole.User )
	create(
	    @CurrentUser() user: JwtUser,
	    @Param( 'productId', ParseObjectIdPipe ) productId: ObjectId,
	    @Body() dto: CreateReviewDto,
	    ): Promise< ReviewResponseDto >
	{
		return this.reviewsService.create(
		    new ObjectId( user.sub ),
		    productId,
		    dto,
		);
	}

	@Patch( 'reviews/:id' )
	@Roles( UserRole.User )
	updateMine(
	    @CurrentUser() user: JwtUser,
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    @Body() dto: UpdateReviewDto,
	    ): Promise< ReviewResponseDto >
	{
		return this.reviewsService.updateMine( new ObjectId( user.sub ), id, dto );
	}

	@Delete( 'reviews/:id' )
	@Roles( UserRole.User )
	@HttpCode( HttpStatus.NO_CONTENT )
	removeMine(
	    @CurrentUser() user: JwtUser,
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    ): Promise< void >
	{
		return this.reviewsService.removeMine( new ObjectId( user.sub ), id );
	}

	@Delete( 'reviews/admin/:id' )
	@Roles( UserRole.Admin )
	@HttpCode( HttpStatus.NO_CONTENT )
	removeAsAdmin(
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    ): Promise< void >
	{
		return this.reviewsService.removeAsAdmin( id );
	}
}