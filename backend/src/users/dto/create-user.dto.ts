import {trimLowercaseString} from '@/common/transformers/string.transformers';
import {Transform} from 'class-transformer';
import {IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';

import {UserRole} from '../types/user-role.enum';

export class CreateUserDto
{
	@Transform( trimLowercaseString ) @IsEmail() @MaxLength( 254 ) email: string;

	@IsString() @MinLength( 6 ) @MaxLength( 128 ) password: string;

	@IsOptional() @IsEnum( UserRole ) role?: UserRole;
}