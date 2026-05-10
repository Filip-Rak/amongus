import {PasswordService} from '@/users/password.service';
import {UserRole} from '@/users/types/user-role.enum';
import {UserStatus} from '@/users/types/user-status.enum';
import {UsersService} from '@/users/users.service';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';

import {JwtPayload, LoginResponse} from './auth.types';
import {LoginDto} from './dto/login.dto';
import {RegisterDto} from './dto/register.dto';

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

		if ( user.status !== UserStatus.Active )
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

		return await this.createLoginResponse( user._id.toHexString(), user.email, user.role );
	}

	async register( dto: RegisterDto ): Promise< LoginResponse >
	{
		const user = await this.usersService.create( {
			email : dto.email,
			password : dto.password,
			role : UserRole.User,
		} );

		return await this.createLoginResponse( user.id, user.email, user.role );
	}

	async createLoginResponse( id: string, email: string, role: UserRole ): Promise< LoginResponse >
	{
		const payload: JwtPayload = {
			sub : id,
			email : email,
			role : role,
		};

		const accessToken = await this.jwtService.signAsync( payload );

		return {
			accessToken,
			tokenType : 'Bearer',
			user : {
				id : id,
				email : email,
				role : role,
			},
		};
	}
}