import {getEnv} from '@/common/get-env';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';

import {JwtPayload, JwtUser} from './auth.types';

@Injectable() export class JwtStrategy extends PassportStrategy
( Strategy )
{
	constructor()
	{
		const jwtSecret = getEnv( 'JWT_SECRET', String );

		super( {
			jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration : false,
			secretOrKey : jwtSecret,
		} );
	}

	validate( payload: JwtPayload ): JwtUser
	{
		if ( !payload.sub || !payload.email || !payload.role )
		{
			throw new UnauthorizedException( 'Invalid token payload' );
		}

		return {
			sub : payload.sub,
			email : payload.email,
			role : payload.role,
		};
	}
}