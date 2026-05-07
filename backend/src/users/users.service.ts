import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {MongoServerError, ObjectId} from 'mongodb';

import {CreateUserDto} from './dto/create-user.dto';
import {ListUsersQueryDto} from './dto/list-users-query.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserResponseDto} from './dto/user-response.dto';
import {PasswordService} from './password.service';
import {UserRecord} from './types/user-document.type';
import {UserRole} from './types/user-role.enum';
import {UsersRepository} from './users.repository';

export interface PaginatedUsersResponseDto {
	items: UserResponseDto[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

@Injectable() export class UsersService
{
	constructor(
	    private readonly usersRepository: UsersRepository,
	    private readonly passwordService: PasswordService,
	)
	{}

	async create( dto: CreateUserDto ): Promise< UserResponseDto >
	{
		const passwordHash = await this.passwordService.hashPassword( dto.password );

		try
		{
			const user = await this.usersRepository.create( {
				email : dto.email,
				passwordHash,
				role : dto.role ?? UserRole.User,
			} );

			return this.toResponseDto( user );
		}
		catch ( error )
		{
			this.handleDuplicateEmailError( error );
			throw error;
		}
	}

	async findAll(
	    query: ListUsersQueryDto,
	    ): Promise< PaginatedUsersResponseDto >
	{
		const page  = query.page ?? 1;
		const limit = query.limit ?? 20;

		const result = await this.usersRepository.findMany( {
			page,
			limit,
			role : query.role,
			search : query.search,
		} );

		return {
			items : result.users.map( ( user ) => this.toResponseDto( user ) ),
			page,
			limit,
			total : result.total,
			totalPages : Math.ceil( result.total / limit ),
		};
	}

	async findOne( id: ObjectId ): Promise< UserResponseDto >
	{
		const user = await this.usersRepository.findById( id );

		if ( !user )
		{
			throw new NotFoundException( 'User not found' );
		}

		return this.toResponseDto( user );
	}

	async update(
	    id: ObjectId,
	    dto: UpdateUserDto,
	    ): Promise< UserResponseDto >
	{
		if ( dto.email === undefined && dto.password === undefined && dto.role === undefined )
		{
			throw new BadRequestException( 'At least one field must be provided' );
		}

		const updateInput: { email?: string; passwordHash?: string; role?: UserRole; } = {};

		if ( dto.email !== undefined )
		{
			updateInput.email = dto.email;
		}

		if ( dto.password !== undefined )
		{
			updateInput.passwordHash = await this.passwordService.hashPassword( dto.password );
		}

		if ( dto.role !== undefined )
		{
			updateInput.role = dto.role;
		}

		try
		{
			const updatedUser = await this.usersRepository.updateById(
			    id,
			    updateInput,
			);

			if ( !updatedUser )
			{
				throw new NotFoundException( 'User not found' );
			}

			return this.toResponseDto( updatedUser );
		}
		catch ( error )
		{
			this.handleDuplicateEmailError( error );
			throw error;
		}
	}

	async remove( id: ObjectId ): Promise< void >
	{
		const deleted = await this.usersRepository.deleteById( id );

		if ( !deleted )
		{
			throw new NotFoundException( 'User not found' );
		}
	}

	async findByEmailForAuth( email: string ): Promise< UserRecord|null >
	{
		return this.usersRepository.findByEmail( email.trim().toLowerCase() );
	}

	private toResponseDto( user: UserRecord ): UserResponseDto
	{
		return {
			id : user._id.toHexString(),
			email : user.email,
			role : user.role,
			createdAt : user.createdAt.toISOString(),
			updatedAt : user.updatedAt.toISOString(),
		};
	}

	private handleDuplicateEmailError( error: unknown ): void
	{
		if ( this.isDuplicateKeyError( error ) )
		{
			throw new ConflictException( 'Email is already in use' );
		}
	}

	private isDuplicateKeyError( error: unknown ): error is MongoServerError
	{
		return error instanceof MongoServerError && error.code === 11000;
	}
}