import type {JwtUser} from '@/auth/auth.types';
import {CurrentUser} from '@/auth/decorators/current-user.decorator';
import {Roles} from '@/auth/decorators/roles.decorator';
import {ParseObjectIdPipe} from '@/common/pipes/parse-object-id.pipe';
import {UserRole} from '@/users/types/user-role.enum';
import {Body, Controller, Get, Param, Post} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CheckoutDto} from './dto/checkout.dto';
import {CheckoutResponseDto, OrderResponseDto} from './dto/order-response.dto';
import {OrdersService} from './orders.service';

@Controller( 'orders' ) @Roles( UserRole.User ) export class OrdersController
{
	constructor( private readonly ordersService: OrdersService ) {}

	@Post( 'checkout' )
	checkout(
	    @CurrentUser() user: JwtUser,
	    @Body() dto: CheckoutDto,
	    ): Promise< CheckoutResponseDto >
	{
		return this.ordersService.checkout( new ObjectId( user.sub ), dto );
	}

	@Get( 'my' ) findMine( @CurrentUser() user: JwtUser ): Promise< OrderResponseDto[] >
	{
		return this.ordersService.findMine( new ObjectId( user.sub ) );
	}

	@Get( ':id' )
	findOneMine(
	    @CurrentUser() user: JwtUser,
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    ): Promise< OrderResponseDto >
	{
		return this.ordersService.findOneMine( new ObjectId( user.sub ), id );
	}
}