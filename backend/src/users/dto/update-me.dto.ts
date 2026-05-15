import {trimLowercaseString} from '@/common/transformers/string.transformers';
import {EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH} from '@/common/validation/validation-limits';
import {Transform} from 'class-transformer';
import {IsEmail, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';

export class UpdateMeDto
{
	@IsOptional() @Transform( trimLowercaseString ) @IsEmail() @MaxLength( EMAIL_MAX_LENGTH ) email?: string;

	@IsOptional() @IsString() @MinLength( PASSWORD_MIN_LENGTH ) @MaxLength( PASSWORD_MAX_LENGTH ) password?: string;

	@IsOptional()
	@IsString()
	@MinLength( PASSWORD_MIN_LENGTH )
	@MaxLength( PASSWORD_MAX_LENGTH )
	currentPassword?: string;
}