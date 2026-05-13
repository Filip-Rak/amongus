import {trimLowercaseString} from '@/common/transformers/string.transformers';
import {Transform} from 'class-transformer';
import {IsEmail, IsString, MaxLength, MinLength} from 'class-validator';

export class RegisterDto
{
	@Transform( trimLowercaseString ) @IsEmail() @MaxLength( 254 ) email: string;

	@IsString() @MinLength( 6 ) @MaxLength( 128 ) password: string;
}