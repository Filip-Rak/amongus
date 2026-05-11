import type {JwtUser} from '@/auth/auth.types';
import {CurrentUser} from '@/auth/decorators/current-user.decorator';
import {Roles} from '@/auth/decorators/roles.decorator';
import {ParseObjectIdPipe} from '@/common/pipes/parse-object-id.pipe';
import {UserRole} from '@/users/types/user-role.enum';
import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CartsService} from './carts.service';
import {AddCartItemDto} from './dto/add-cart-item.dto';
import {CartResponseDto} from './dto/cart-response.dto';
import {UpdateCartItemDto} from './dto/update-cart-item.dto';

@Controller( 'cart' ) @Roles( UserRole.User ) export class CartsController
{
	constructor( private readonly cartsService: CartsService ) {}

	@Get() findMine( @CurrentUser() user: JwtUser ): Promise< CartResponseDto >
	{
		return this.cartsService.findMine( new ObjectId( user.sub ) );
	}

	@Post( 'items' )
	addItem(
	    @CurrentUser() user: JwtUser,
	    @Body() dto: AddCartItemDto,
	    ): Promise< CartResponseDto >
	{
		return this.cartsService.addItem( new ObjectId( user.sub ), dto );
	}

	@Patch( 'items/:productId' )
	updateItem(
	    @CurrentUser() user: JwtUser,
	    @Param( 'productId', ParseObjectIdPipe ) productId: ObjectId,
	    @Body() dto: UpdateCartItemDto,
	    ): Promise< CartResponseDto >
	{
		return this.cartsService.updateItem(
		    new ObjectId( user.sub ),
		    productId,
		    dto,
		);
	}

	@Delete( 'items/:productId' )
	@HttpCode( HttpStatus.NO_CONTENT )
	removeItem(
	    @CurrentUser() user: JwtUser,
	    @Param( 'productId', ParseObjectIdPipe ) productId: ObjectId,
	    ): Promise< void >
	{
		return this.cartsService.removeItem( new ObjectId( user.sub ), productId );
	}

	@Delete() @HttpCode( HttpStatus.NO_CONTENT ) clear( @CurrentUser() user: JwtUser ): Promise< void >
	{
		return this.cartsService.clear( new ObjectId( user.sub ) );
	}
}