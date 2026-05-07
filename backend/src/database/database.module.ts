import {getEnv} from '@/common/get-env';
import {Global, Module} from '@nestjs/common';
import {Db, MongoClient} from 'mongodb';

import {DatabaseService} from './database.service';
import {MONGO_CLIENT, MONGO_DB} from './database.tokens';

@Global()
@Module( {
	providers : [
		{
			provide : MONGO_CLIENT,
			useFactory : async() : Promise< MongoClient > => {
	            const uri = getEnv( 'MONGODB_URI', String );

	            const client = new MongoClient( uri, {
		            serverSelectionTimeoutMS : 5000,
	            } );

	            await client.connect();

	            return client;
			},
		},
		{
			provide : MONGO_DB,
			inject : [ MONGO_CLIENT ],
			useFactory : ( client: MongoClient ) : Db => {
	            const dbName = getEnv( 'MONGODB_DB_NAME', String );

	            return client.db( dbName );
			},
		},
		DatabaseService,
	],
	exports : [ MONGO_CLIENT, MONGO_DB, DatabaseService ],
} )
export class DatabaseModule
{}