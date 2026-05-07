import {PasswordService} from '@/users/password.service';
import {UsersService} from '@/users/users.service';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';

import {JwtPayload, LoginResponse} from './auth.types';
import {LoginDto} from './dto/login.dto';

@Injectable() export class AuthService
{
	constructor(
	    private readonly usersService: UsersService,
	    private readonly passwordService: PasswordService,
	    private readonly jwtService: JwtService,
	)
	{}

	async login( dto: LoginDto ): Promise< LoginResponse >
	{
		const user = await this.usersService.findByEmailForAuth( dto.email );

		if ( !user )
		{
			throw new UnauthorizedException( 'Invalid credentials' );
		}

		const passwordMatches = await this.passwordService.verifyPassword(
		    dto.password,
		    user.passwordHash,
		);

		if ( !passwordMatches )
		{
			throw new UnauthorizedException( 'Invalid credentials' );
		}

		const payload: JwtPayload = {
			sub : user._id.toHexString(),
			email : user.email,
			role : user.role,
		};

		const accessToken = await this.jwtService.signAsync( payload );

		return {
			accessToken,
			tokenType : 'Bearer',
			user : {
				id : user._id.toHexString(),
				email : user.email,
				role : user.role,
			},
		};
	}
}