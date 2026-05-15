import {PRODUCT_IMAGE_ALT_MAX_LENGTH} from '@/common/validation/validation-limits';
import {IsBoolean, IsOptional, IsString, IsUrl, MaxLength} from 'class-validator';

export class ProductImageDto
{
	@IsUrl( {
		protocols : [ 'http', 'https' ],
		require_protocol: true,
		require_tld: false,
	} )
	url: string;

	@IsOptional() @IsString() @MaxLength( PRODUCT_IMAGE_ALT_MAX_LENGTH ) alt?: string;

	@IsBoolean() isPrimary: boolean;
}