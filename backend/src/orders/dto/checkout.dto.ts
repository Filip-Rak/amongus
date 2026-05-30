import {trimString} from '@/common/transformers/string.transformers';
import {
	ADDRESS_CITY_MAX_LENGTH,
	ADDRESS_COUNTRY_MAX_LENGTH,
	ADDRESS_COUNTRY_MIN_LENGTH,
	ADDRESS_FULL_NAME_MAX_LENGTH,
	ADDRESS_LINE_MAX_LENGTH,
	ADDRESS_PHONE_MAX_LENGTH,
	ADDRESS_POSTAL_CODE_MAX_LENGTH,
	COMPANY_NAME_MAX_LENGTH,
	COMPANY_TAX_ID_MAX_LENGTH,
	TEXT_MIN_LENGTH
} from '@/common/validation/validation-limits';
import {PurchaseType} from '@/orders/types/purchase-type.enum';
import {Transform, Type} from 'class-transformer';
import {
	IsBoolean,
	IsDefined,
	IsEnum,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
	ValidateNested
} from 'class-validator';

export class CheckoutAddressDto
{
	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( ADDRESS_FULL_NAME_MAX_LENGTH )
	fullName: string;

	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( ADDRESS_LINE_MAX_LENGTH )
	line1: string;

	@IsOptional() @Transform( trimString ) @IsString() @MaxLength( ADDRESS_LINE_MAX_LENGTH ) line2?: string;

	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( ADDRESS_CITY_MAX_LENGTH )
	city: string;

	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( ADDRESS_POSTAL_CODE_MAX_LENGTH )
	postalCode: string;

	@Transform( trimString )
	@IsString()
	@MinLength( ADDRESS_COUNTRY_MIN_LENGTH )
	@MaxLength( ADDRESS_COUNTRY_MAX_LENGTH )
	country: string;

	@IsOptional() @Transform( trimString ) @IsString() @MaxLength( ADDRESS_PHONE_MAX_LENGTH ) phone?: string;
}

export class CheckoutCompanyDetailsDto
{
	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( COMPANY_NAME_MAX_LENGTH )
	companyName: string;

	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( COMPANY_TAX_ID_MAX_LENGTH )
	taxId: string;
}

export class CheckoutInvoiceDto
{
	@IsOptional() @IsBoolean() requested?: boolean;

	@IsOptional() @IsBoolean() billingAddressSameAsShipping?: boolean;

	@IsOptional() @ValidateNested() @Type( () => CheckoutAddressDto ) billingAddress?: CheckoutAddressDto;

	@IsOptional() @ValidateNested() @Type( () => CheckoutCompanyDetailsDto ) companyDetails?: CheckoutCompanyDetailsDto;
}

export class CheckoutDto
{
	@IsOptional() @IsEnum( PurchaseType ) purchaseType?: PurchaseType;

	@IsOptional() @ValidateNested() @Type( () => CheckoutInvoiceDto ) invoice?: CheckoutInvoiceDto;

	@IsDefined() @ValidateNested() @Type( () => CheckoutAddressDto ) shippingAddress: CheckoutAddressDto;
}