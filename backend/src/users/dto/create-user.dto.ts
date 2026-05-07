import {Transform} from 'class-transformer';
import {IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';

import {UserRole} from '../types/user-role.enum';

export class CreateUserDto
{
	@Transform(
	    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
	    ( { value } ) => typeof value === 'string' ? value.trim().toLowerCase() : value,
	    )
	@IsEmail()
	@MaxLength( 254 )
	email: string;

	@IsString() @MinLength( 6 ) @MaxLength( 128 ) password: string;

	@IsOptional() @IsEnum( UserRole ) role?: UserRole;
}