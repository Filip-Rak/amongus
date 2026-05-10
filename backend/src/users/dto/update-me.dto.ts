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
	@IsOptional()
	@Transform(
	    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
	    ( { value } ) => typeof value === 'string' ? value.trim().toLowerCase() : value,
	    )
	@IsEmail()
	@MaxLength( 254 )
	email?: string;

	@IsOptional() @IsString() @MinLength( 6 ) @MaxLength( 128 ) password?: string;

	@IsOptional() @IsString() @MinLength( 6 ) @MaxLength( 128 ) currentPassword?: string;
}