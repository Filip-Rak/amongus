import {isMongoDocumentValidationError} from '@/common/mongo/mongo-errors';
import {Inject, Injectable, Logger, OnApplicationShutdown} from '@nestjs/common';
import {ClientSession, Collection, Db, Document, MongoClient, TransactionOptions} from 'mongodb';

import {MONGO_CLIENT, MONGO_DB} from './database.tokens';

@Injectable() export class DatabaseService implements OnApplicationShutdown
{
	private readonly logger = new Logger( DatabaseService.name );

	constructor(
	    @Inject( MONGO_CLIENT ) private readonly client: MongoClient,
	    @Inject( MONGO_DB ) private readonly db: Db,
	)
	{}

	collection< TSchema extends Document = Document >(
	    name: string,
	    ): Collection< TSchema >
	{
		return this.db.collection< TSchema >( name );
	}

	async onApplicationShutdown(): Promise< void >
	{
		this.logger.log( 'Closing MongoDB connection...' );
		await this.client.close();
	}

	async ping(): Promise< boolean >
	{
		const result = await this.db.command( { ping : 1 } );
		return result.ok === 1;
	}

	async withTransaction< T >(
	    callback: ( session: ClientSession ) => Promise< T >,
	    ): Promise< T >
	{
		const session = this.client.startSession();

		const transactionOptions: TransactionOptions = {
			readConcern : {
				level : 'snapshot',
			},
			writeConcern : {
				w : 'majority',
			},
		};

		try
		{
			let result!: T;

			await session.withTransaction( async () => { result = await callback( session ); }, transactionOptions );

			return result;
		}
		catch ( error )
		{
			this.logger.error(
			    'MongoDB transaction failed',
			    error instanceof Error ? error.stack : String( error ),
			);

			if ( isMongoDocumentValidationError( error ) )
			{
				this.logger.error(
				    'MongoDB validation details',
				    JSON.stringify( error.errInfo, null, 2 ),
				);
			}

			throw error;
		}
		finally
		{
			await session.endSession();
		}
	}

	getDb(): Db
	{
		return this.db;
	}
}