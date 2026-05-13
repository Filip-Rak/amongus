import {trimLowercaseString} from '@/common/transformers/string.transformers';
import {UserRole} from '@/users/types/user-role.enum';
import {UserStatus} from '@/users/types/user-status.enum';
import {Transform} from 'class-transformer';
import {IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';

export class UpdateUserDto
{
	@IsOptional() @Transform( trimLowercaseString ) @IsEmail() @MaxLength( 254 ) email?: string;

	@IsOptional() @IsString() @MinLength( 6 ) @MaxLength( 128 ) password?: string;

	@IsOptional() @IsEnum( UserRole ) role?: UserRole;
	@IsOptional() @IsEnum( UserStatus ) status?: UserStatus;
}