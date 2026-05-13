import {trimString} from '@/common/transformers/string.transformers';
import {Transform, Type} from 'class-transformer';
import {IsDefined, IsOptional, IsString, MaxLength, MinLength, ValidateNested} from 'class-validator';

export class CheckoutAddressDto
{
	@Transform( trimString ) @IsString() @MinLength( 1 ) @MaxLength( 120 ) fullName: string;

	@Transform( trimString ) @IsString() @MinLength( 1 ) @MaxLength( 200 ) line1: string;

	@IsOptional() @Transform( trimString ) @IsString() @MaxLength( 200 ) line2?: string;

	@Transform( trimString ) @IsString() @MinLength( 1 ) @MaxLength( 100 ) city: string;

	@Transform( trimString ) @IsString() @MinLength( 1 ) @MaxLength( 20 ) postalCode: string;

	@Transform( trimString ) @IsString() @MinLength( 2 ) @MaxLength( 80 ) country: string;

	@IsOptional() @Transform( trimString ) @IsString() @MaxLength( 30 ) phone?: string;
}

export class CheckoutDto
{
	@IsDefined() @ValidateNested() @Type( () => CheckoutAddressDto ) shippingAddress: CheckoutAddressDto;
}