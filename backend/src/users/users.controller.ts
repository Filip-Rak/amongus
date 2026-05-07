import {Roles} from '@/auth/decorators/roles.decorator';
import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {ParseObjectIdPipe} from '../common/pipes/parse-object-id.pipe';

import {CreateUserDto} from './dto/create-user.dto';
import {ListUsersQueryDto} from './dto/list-users-query.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserResponseDto} from './dto/user-response.dto';
import {UserRole} from './types/user-role.enum';
import {PaginatedUsersResponseDto, UsersService} from './users.service';

@Roles( UserRole.Admin ) @Controller( 'users' ) export class UsersController
{
	constructor( private readonly usersService: UsersService ) {}

	@Post() create( @Body() dto: CreateUserDto ): Promise< UserResponseDto >
	{
		return this.usersService.create( dto );
	}

	@Get()
	findAll(
	    @Query() query: ListUsersQueryDto,
	    ): Promise< PaginatedUsersResponseDto >
	{
		return this.usersService.findAll( query );
	}

	@Get( ':id' )
	findOne(
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    ): Promise< UserResponseDto >
	{
		return this.usersService.findOne( id );
	}

	@Patch( ':id' )
	update(
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    @Body() dto: UpdateUserDto,
	    ): Promise< UserResponseDto >
	{
		return this.usersService.update( id, dto );
	}

	@Delete( ':id' )
	@HttpCode( HttpStatus.NO_CONTENT )
	remove( @Param( 'id', ParseObjectIdPipe ) id: ObjectId ): Promise< void >
	{
		return this.usersService.remove( id );
	}
}