import {trimLowercaseString} from '@/common/transformers/string.transformers';
import {EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH} from '@/common/validation/validation-limits';
import {UserRole} from '@/users/types/user-role.enum';
import {UserStatus} from '@/users/types/user-status.enum';
import {Transform} from 'class-transformer';
import {IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';

export class UpdateUserDto
{
	@IsOptional() @Transform( trimLowercaseString ) @IsEmail() @MaxLength( EMAIL_MAX_LENGTH ) email?: string;

	@IsOptional() @IsString() @MinLength( PASSWORD_MIN_LENGTH ) @MaxLength( PASSWORD_MAX_LENGTH ) password?: string;

	@IsOptional() @IsEnum( UserRole ) role?: UserRole;
	@IsOptional() @IsEnum( UserStatus ) status?: UserStatus;
}