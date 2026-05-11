import {Transform, Type} from 'class-transformer';
import {IsOptional, IsString, MaxLength, MinLength, ValidateNested} from 'class-validator';

export class CheckoutAddressDto
{
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform( ( { value } ) => typeof value === 'string' ? value.trim() : value )
	@IsString()
	@MinLength( 1 )
	@MaxLength( 120 )
	fullName: string;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform( ( { value } ) => typeof value === 'string' ? value.trim() : value )
	@IsString()
	@MinLength( 1 )
	@MaxLength( 200 )
	line1: string;

	@IsOptional()
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform( ( { value } ) => typeof value === 'string' ? value.trim() : value )
	@IsString()
	@MaxLength( 200 )
	line2?: string;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform( ( { value } ) => typeof value === 'string' ? value.trim() : value )
	@IsString()
	@MinLength( 1 )
	@MaxLength( 100 )
	city: string;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform( ( { value } ) => typeof value === 'string' ? value.trim() : value )
	@IsString()
	@MinLength( 1 )
	@MaxLength( 20 )
	postalCode: string;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform( ( { value } ) => typeof value === 'string' ? value.trim() : value )
	@IsString()
	@MinLength( 2 )
	@MaxLength( 80 )
	country: string;

	@IsOptional()
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform( ( { value } ) => typeof value === 'string' ? value.trim() : value )
	@IsString()
	@MaxLength( 30 )
	phone?: string;
}

export class CheckoutDto
{
	@ValidateNested() @Type( () => CheckoutAddressDto ) shippingAddress: CheckoutAddressDto;
}