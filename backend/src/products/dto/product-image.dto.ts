import {IsBoolean, IsOptional, IsString, IsUrl, MaxLength} from 'class-validator';

export class ProductImageDto
{
	@IsUrl( {
		protocols : [ 'http', 'https' ],
		require_protocol: true,
		require_tld: false,
	} )
	url: string;

	@IsOptional() @IsString() @MaxLength( 200 ) alt?: string;

	@IsBoolean() isPrimary: boolean;
}