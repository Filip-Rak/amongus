import {Inject, Injectable, Logger, OnApplicationShutdown} from '@nestjs/common';
import {Collection, Db, Document, MongoClient} from 'mongodb';

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

	async ping(): Promise< boolean >
	{
		const result = await this.db.command( { ping : 1 } );

		return result.ok === 1;
	}

	async onApplicationShutdown(): Promise< void >
	{
		this.logger.log( 'Closing MongoDB connection...' );
		await this.client.close();
	}
}