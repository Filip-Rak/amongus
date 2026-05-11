import {getEnv} from '@/common/get-env';
import {UsersModule} from '@/users/users.module';
import {Module} from '@nestjs/common';
import {APP_GUARD} from '@nestjs/core';
import {JwtModule} from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';
import type {StringValue} from 'ms';

import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';
import {JwtAuthGuard} from './guards/jwt-auth.guard';
import {RolesGuard} from './guards/roles.guard';
import {JwtStrategy} from './jwt.strategy';

const jwtAccessTokenExpiresIn = getEnv( 'JWT_ACCESS_TOKEN_EXPIRES_IN', String ) as StringValue;

@Module( {
	imports : [
		UsersModule,
		PassportModule,
		JwtModule.register( {
			secret : getEnv( 'JWT_SECRET', String ),
			signOptions : {
				expiresIn : jwtAccessTokenExpiresIn,
			},
		} ),
	],
	controllers : [ AuthController ],
	providers : [
		AuthService,
		JwtStrategy,
		{
			provide : APP_GUARD,
			useClass : JwtAuthGuard,
		},
		{
			provide : APP_GUARD,
			useClass : RolesGuard,
		},
	],
	exports : [ AuthService ],
} )
export class AuthModule
{}