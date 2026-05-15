import {trimLowercaseString} from '@/common/transformers/string.transformers';
import {EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH} from '@/common/validation/validation-limits';
import {UserRole} from '@/users/types/user-role.enum';
import {Transform} from 'class-transformer';
import {IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';

export class CreateUserDto
{
	@Transform( trimLowercaseString ) @IsEmail() @MaxLength( EMAIL_MAX_LENGTH ) email: string;

	@IsString() @MinLength( PASSWORD_MIN_LENGTH ) @MaxLength( PASSWORD_MAX_LENGTH ) password: string;

	@IsOptional() @IsEnum( UserRole ) role?: UserRole;
}