import type {JwtUser} from '@/auth/auth.types';
import {CurrentUser} from '@/auth/decorators/current-user.decorator';
import {Roles} from '@/auth/decorators/roles.decorator';
import {ParseObjectIdPipe} from '@/common/pipes/parse-object-id.pipe';
import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CreateUserDto} from './dto/create-user.dto';
import {ListUsersQueryDto} from './dto/list-users-query.dto';
import {UpdateMeDto} from './dto/update-me.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserResponseDto} from './dto/user-response.dto';
import {UserRole} from './types/user-role.enum';
import {PaginatedUsersResponseDto, UsersService} from './users.service';

@Controller( 'users' ) export class UsersController
{
	constructor( private readonly usersService: UsersService ) {}

	@Get( 'me' ) findMe( @CurrentUser() user: JwtUser ): Promise< UserResponseDto >
	{
		return this.usersService.findMe( new ObjectId( user.sub ) );
	}

	@Patch( 'me' )
	updateMe(
	    @CurrentUser() user: JwtUser,
	    @Body() dto: UpdateMeDto,
	    ): Promise< UserResponseDto >
	{
		return this.usersService.updateMe( new ObjectId( user.sub ), dto );
	}

	@Delete( 'me' )
	@Roles( UserRole.User )
	@HttpCode( HttpStatus.NO_CONTENT )
	removeMe( @CurrentUser() user: JwtUser ): Promise< void >
	{
		return this.usersService.remove( new ObjectId( user.sub ) );
	}

	@Post() @Roles( UserRole.Admin ) create( @Body() dto: CreateUserDto ): Promise< UserResponseDto >
	{
		return this.usersService.create( dto );
	}

	@Get()
	@Roles( UserRole.Admin )
	findAll(
	    @Query() query: ListUsersQueryDto,
	    ): Promise< PaginatedUsersResponseDto >
	{
		return this.usersService.findAll( query );
	}

	@Get( ':id' )
	@Roles( UserRole.Admin )
	findOne(
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    ): Promise< UserResponseDto >
	{
		return this.usersService.findOne( id );
	}

	@Patch( ':id' )
	@Roles( UserRole.Admin )
	update(
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    @Body() dto: UpdateUserDto,
	    ): Promise< UserResponseDto >
	{
		return this.usersService.update( id, dto );
	}

	@Delete( ':id' )
	@Roles( UserRole.Admin )
	@HttpCode( HttpStatus.NO_CONTENT )
	remove( @Param( 'id', ParseObjectIdPipe ) id: ObjectId ): Promise< void >
	{
		return this.usersService.remove( id );
	}
}