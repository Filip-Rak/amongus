import {isMongoDuplicateKeyError} from '@/common/mongo/mongo-errors';
import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import {ObjectId} from 'mongodb';

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

type CredentialUpdateDto = {
	email?: string;
	password?: string;
};

type CredentialUpdateInput = {
	email?: string;
	passwordHash?: string;
};

type AdminUpdateInput = CredentialUpdateInput&
{
	role?: UserRole;
	status?: UserStatus;
};

@Injectable() export class UsersService
{
	constructor(
	    private readonly usersRepository: UsersRepository,
	    private readonly passwordService: PasswordService,
	)
	{}

	async create( dto: CreateUserDto ): Promise< UserResponseDto >
	{
		return this.withDuplicateEmailHandling( async () => {
			const passwordHash = await this.passwordService.hashPassword( dto.password );

			const user = await this.usersRepository.create( {
				email : dto.email,
				passwordHash,
				role : dto.role ?? UserRole.User,
			} );

			return this.toResponseDto( user );
		} );
	}

	async findAll( query: ListUsersQueryDto ): Promise< PaginatedUsersResponseDto >
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
		const user = await this.getUserOrThrow( id );

		return this.toResponseDto( user );
	}

	async findMe( id: ObjectId ): Promise< UserResponseDto >
	{
		const user = await this.getActiveUserOrThrow( id );

		return this.toResponseDto( user );
	}

	async update( id: ObjectId, dto: UpdateUserDto ): Promise< UserResponseDto >
	{
		const updateInput = await this.buildAdminUpdateInput( dto );

		this.assertUpdateIsNotEmpty( updateInput );

		const existingUser = await this.getUserOrThrow( id );

		await this.ensureActiveAdminWouldRemainAfter( existingUser, updateInput );

		return this.withDuplicateEmailHandling( async () => {
			const updatedUser = await this.usersRepository.updateById( id, updateInput );

			if ( !updatedUser )
			{
				throw new NotFoundException( 'User not found' );
			}

			return this.toResponseDto( updatedUser );
		} );
	}

	async updateMe( id: ObjectId, dto: UpdateMeDto ): Promise< UserResponseDto >
	{
		const updateInput = await this.buildCredentialUpdateInput( dto );

		this.assertUpdateIsNotEmpty( updateInput );
		this.assertCurrentPasswordProvided( dto );

		const user = await this.getActiveUserOrThrow( id );

		await this.assertCurrentPasswordMatches( dto.currentPassword ?? "", user.passwordHash );

		return this.withDuplicateEmailHandling( async () => {
			const updatedUser = await this.usersRepository.updateById( id, updateInput );

			if ( !updatedUser )
			{
				throw new NotFoundException( 'User not found' );
			}

			return this.toResponseDto( updatedUser );
		} );
	}

	async remove( id: ObjectId ): Promise< void >
	{
		const existingUser = await this.getUserOrThrow( id );

		await this.ensureActiveAdminWouldRemainAfter( existingUser, {
			status : UserStatus.Deleted,
		} );

		const deleted = await this.usersRepository.softDeleteById( id );

		if ( !deleted )
		{
			throw new NotFoundException( 'User not found' );
		}
	}

	async removeMe( id: ObjectId ): Promise< void >
	{
		const user = await this.getActiveUserOrThrow( id );

		if ( user.role !== UserRole.User )
		{
			throw new ForbiddenException( 'Only regular users can deactivate their own account' );
		}

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

	private async getUserOrThrow( id: ObjectId ): Promise< UserRecord >
	{
		const user = await this.usersRepository.findById( id );

		if ( !user )
		{
			throw new NotFoundException( 'User not found' );
		}

		return user;
	}

	private async getActiveUserOrThrow( id: ObjectId ): Promise< UserRecord >
	{
		const user = await this.getUserOrThrow( id );

		if ( user.status !== UserStatus.Active )
		{
			throw new NotFoundException( 'User not found' );
		}

		return user;
	}

	private async buildAdminUpdateInput( dto: UpdateUserDto ): Promise< AdminUpdateInput >
	{
		const credentialUpdateInput = await this.buildCredentialUpdateInput( dto );

		return this.omitUndefined( {
			...credentialUpdateInput,
			role : dto.role,
			status : dto.status,
		} );
	}

	private async buildCredentialUpdateInput(
	    dto: CredentialUpdateDto,
	    ): Promise< CredentialUpdateInput >
	{
		const passwordHash =
		    dto.password === undefined ? undefined : await this.passwordService.hashPassword( dto.password );

		return this.omitUndefined( {
			email : dto.email,
			passwordHash,
		} );
	}

	private assertUpdateIsNotEmpty( updateInput: object ): void
	{
		if ( Object.keys( updateInput ).length === 0 )
		{
			throw new BadRequestException( 'At least one field must be provided' );
		}
	}

	private assertCurrentPasswordProvided( dto: UpdateMeDto ): void
	{
		if ( !dto.currentPassword )
		{
			throw new BadRequestException(
			    'Current password is required to change email or password',
			);
		}
	}

	private async assertCurrentPasswordMatches(
	    currentPassword: string,
	    passwordHash: string,
	    ): Promise< void >
	{
		const passwordMatches = await this.passwordService.verifyPassword(
		    currentPassword,
		    passwordHash,
		);

		if ( !passwordMatches )
		{
			throw new ForbiddenException( 'Current password is incorrect' );
		}
	}

	private async ensureActiveAdminWouldRemainAfter(
	    existingUser: UserRecord,
	    updateInput: Pick< AdminUpdateInput, 'role'|'status' >,
	    ): Promise< void >
	{
		const currentlyActiveAdmin = existingUser.role === UserRole.Admin && existingUser.status === UserStatus.Active;

		if ( !currentlyActiveAdmin )
		{
			return;
		}

		const roleAfterUpdate   = updateInput.role ?? existingUser.role;
		const statusAfterUpdate = updateInput.status ?? existingUser.status;

		const remainsActiveAdmin = roleAfterUpdate === UserRole.Admin && statusAfterUpdate === UserStatus.Active;

		if ( remainsActiveAdmin )
		{
			return;
		}

		const otherActiveAdmins = await this.usersRepository.countActiveAdminsExcept( existingUser._id );

		if ( otherActiveAdmins === 0 )
		{
			throw new BadRequestException( 'Cannot remove the last active admin' );
		}
	}

	private async withDuplicateEmailHandling< T >(
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
				throw new ConflictException( 'Email is already in use' );
			}

			throw error;
		}
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

	private omitUndefined< T extends object >( object: T ): Partial< T >
	{
		return Object.fromEntries(
		           Object.entries( object ).filter( ( [, value ] ) => value !== undefined ),
		           ) as Partial< T >;
	}
}