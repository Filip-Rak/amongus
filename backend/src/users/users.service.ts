import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {MongoServerError, ObjectId} from 'mongodb';

import {CreateUserDto} from './dto/create-user.dto';
import {ListUsersQueryDto} from './dto/list-users-query.dto';
import {UpdateMeDto} from './dto/update-me.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserResponseDto} from './dto/user-response.dto';
import {PasswordService} from './password.service';
import {UserRecord} from './types/user-document.type';
import {UserRole} from './types/user-role.enum';
import {UserStatus} from './types/user-status.enum';
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
		if ( dto.email === undefined && dto.password === undefined && dto.role === undefined &&
		     dto.status === undefined )
		{
			throw new BadRequestException( 'At least one field must be provided' );
		}

		const updateInput: { email?: string; passwordHash?: string; role?: UserRole; status?: UserStatus } = {};

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

		if ( dto.status !== undefined )
		{
			updateInput.status = dto.status;
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
		const deleted = await this.usersRepository.softDeleteById( id );
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
			status : user.status,
			createdAt : user.createdAt.toISOString(),
			updatedAt : user.updatedAt.toISOString(),
			deletedAt : user.deletedAt?.toISOString(),
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

	async findMe( id: ObjectId ): Promise< UserResponseDto >
	{
		const user = await this.usersRepository.findById( id );

		if ( !user || user.status !== UserStatus.Active )
		{
			throw new NotFoundException( 'User not found' );
		}

		return this.toResponseDto( user );
	}

	async updateMe(
	    id: ObjectId,
	    dto: UpdateMeDto,
	    ): Promise< UserResponseDto >
	{
		if ( dto.email === undefined && dto.password === undefined )
		{
			throw new BadRequestException( 'At least one field must be provided' );
		}

		if ( !dto.currentPassword )
		{
			throw new BadRequestException(
			    'Current password is required to change email or password',
			);
		}

		const user = await this.usersRepository.findById( id );

		if ( !user || user.status !== UserStatus.Active )
		{
			throw new NotFoundException( 'User not found' );
		}

		const passwordMatches = await this.passwordService.verifyPassword(
		    dto.currentPassword,
		    user.passwordHash,
		);

		if ( !passwordMatches )
		{
			throw new ForbiddenException( 'Current password is incorrect' );
		}

		const updateInput: { email?: string; passwordHash?: string; } = {};

		if ( dto.email !== undefined )
		{
			updateInput.email = dto.email;
		}

		if ( dto.password !== undefined )
		{
			updateInput.passwordHash = await this.passwordService.hashPassword( dto.password );
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
}