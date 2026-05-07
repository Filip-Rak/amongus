import 'dotenv/config';

import {getEnv} from '@/utility/get-env';
import {ValidationPipe} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';

import {AppModule} from './app.module';

async function bootstrap()
{
	const app = await NestFactory.create( AppModule );
	app.useGlobalPipes( new ValidationPipe( {
		whitelist : true,
		forbidNonWhitelisted : true,
		transform : true,
	} ) );

	app.enableCors( { origin : getEnv( "FRONTEND_URL", String ) } );

	const serverPort = getEnv( 'BACKEND_PORT', Number );
	await app.listen( serverPort );
}
bootstrap().catch( console.error );
