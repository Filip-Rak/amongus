import {trimLowercaseString} from '@/common/transformers/string.transformers';
import {Transform} from 'class-transformer';
import {
	IsEmail,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator';

export class UpdateMeDto
{
	@IsOptional() @Transform( trimLowercaseString ) @IsEmail() @MaxLength( 254 ) email?: string;

	@IsOptional() @IsString() @MinLength( 6 ) @MaxLength( 128 ) password?: string;

	@IsOptional() @IsString() @MinLength( 6 ) @MaxLength( 128 ) currentPassword?: string;
}