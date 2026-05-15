import {trimLowercaseString} from '@/common/transformers/string.transformers';
import {EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH} from '@/common/validation/validation-limits';
import {Transform} from 'class-transformer';
import {IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';

import {UserRole} from '../types/user-role.enum';

export class CreateUserDto
{
	@Transform( trimLowercaseString ) @IsEmail() @MaxLength( EMAIL_MAX_LENGTH ) email: string;

	@IsString() @MinLength( PASSWORD_MIN_LENGTH ) @MaxLength( PASSWORD_MAX_LENGTH ) password: string;

	@IsOptional() @IsEnum( UserRole ) role?: UserRole;
}