import {Injectable, OnModuleInit} from '@nestjs/common';
import {Collection, Filter, ObjectId, UpdateFilter} from 'mongodb';

import {DatabaseService} from '../database/database.service';

import {UserDocument, UserRecord} from './types/user-document.type';
import {UserRole} from './types/user-role.enum';
import {UserStatus} from './types/user-status.enum';

export interface CreateUserInput {
	email: string;
	passwordHash: string;
	role: UserRole;
}

export interface UpdateUserInput {
	email?: string;
	passwordHash?: string;
	role?: UserRole;
}

export interface FindUsersInput {
	page: number;
	limit: number;
	role?: UserRole;
	search?: string;
}

export interface FindUsersResult {
	users: UserRecord[];
	total: number;
}

@Injectable() export class UsersRepository implements OnModuleInit
{
	private readonly users: Collection< UserDocument >;

	constructor( private readonly databaseService: DatabaseService )
	{
		this.users = this.databaseService.collection< UserDocument >( 'users' );
	}

	async onModuleInit(): Promise< void >
	{
		await this.ensureIndexes();
	}

	private async ensureIndexes(): Promise< void >
	{
		await this.users.createIndex(
		    { email : 1 },
		    {
			    unique : true,
			    name : 'uq_users_email',
		    },
		);

		await this.users.createIndex(
		    { role : 1 },
		    {
			    name : 'ix_users_role',
		    },
		);

		await this.users.createIndex(
		    { status : 1 },
		    {
			    name : 'ix_users_status',
		    },
		);
	}

	async create( input: CreateUserInput ): Promise< UserRecord >
	{
		const now = new Date();

		const document: UserDocument = {
			email : input.email,
			passwordHash : input.passwordHash,
			role : input.role,
			status : UserStatus.Active,
			createdAt : now,
			updatedAt : now,
		};

		const result = await this.users.insertOne( document );

		return {
			_id : result.insertedId,
			...document,
		};
	}

	async findById( id: ObjectId ): Promise< UserRecord|null >
	{
		return this.users.findOne( { _id : id } );
	}

	async findByEmail( email: string ): Promise< UserRecord|null >
	{
		return this.users.findOne( { email } );
	}

	async findMany( input: FindUsersInput ): Promise< FindUsersResult >
	{
		const filter = this.buildFilter( input );

		const skip = ( input.page - 1 ) * input.limit;

		const [ users, total ] = await Promise.all( [
			this.users.find( filter ).sort( { createdAt : -1 } ).skip( skip ).limit( input.limit ).toArray(),
			this.users.countDocuments( filter ),
		] );

		return {
			users,
			total,
		};
	}

	async updateById(
	    id: ObjectId,
	    input: UpdateUserInput,
	    ): Promise< UserRecord|null >
	{
		const update: UpdateFilter< UserDocument > = {
			$set : {
				...input,
				updatedAt : new Date(),
			},
		};

		return this.users.findOneAndUpdate(
		    { _id : id },
		    update,
		    {
			    returnDocument : 'after',
		    },
		);
	}

	async softDeleteById( id: ObjectId ): Promise< boolean >
	{
		const result = await this.users.updateOne(
		    {
			    _id : id,
			    status : UserStatus.Active,
		    },
		    {
			    $set : {
				    status : UserStatus.Deleted,
				    deletedAt : new Date(),
				    updatedAt : new Date(),
			    },
		    },
		);

		return result.modifiedCount === 1;
	}

	private buildFilter( input: FindUsersInput ): Filter< UserDocument >
	{
		const filter: Filter< UserDocument > = {};

		if ( input.role )
		{
			filter.role = input.role;
		}

		if ( input.search?.trim() )
		{
			const escapedSearch = escapeRegExp( input.search.trim().toLowerCase() );

			filter.email = {
				$regex : escapedSearch,
				$options : 'i',
			};
		}

		return filter;
	}

	async countActiveAdminsExcept( id: ObjectId ): Promise< number >
	{
		return this.users.countDocuments( {
			_id : { $ne : id },
			role : UserRole.Admin,
			status : UserStatus.Active,
		} );
	}
}

function escapeRegExp( value: string ): string
{
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}