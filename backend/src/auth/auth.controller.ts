import {Body, Controller, Get, Post} from '@nestjs/common';

import {AuthService} from './auth.service';
import type {JwtUser, LoginResponse} from './auth.types';
import {CurrentUser} from './decorators/current-user.decorator';
import {Public} from './decorators/public.decorator';
import {LoginDto} from './dto/login.dto';

@Controller( 'auth' ) export class AuthController
{
	constructor( private readonly authService: AuthService ) {}

	@Public() @Post( 'login' ) login( @Body() dto: LoginDto ): Promise< LoginResponse >
	{
		return this.authService.login( dto );
	}

	@Get( 'me' ) me( @CurrentUser() user: JwtUser ): JwtUser
	{
		return user;
	}
}