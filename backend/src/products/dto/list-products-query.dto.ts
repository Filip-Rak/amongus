import {
	LIMIT_DEFAULT,
	LIMIT_MAX,
	LIMIT_MIN,
	PAGE_DEFAULT,
	PAGE_MIN,
	PRICE_MIN_AMOUNT
} from '@/common/validation/validation-limits';
import {ProductStatus} from '@/products/types/product-status.enum';
import {Transform, Type} from 'class-transformer';
import {IsBoolean, IsEnum, IsInt, IsMongoId, IsOptional, IsString, Max, Min} from 'class-validator';

function toBoolean( value: unknown ): unknown
{
	if ( value === 'true' )
	{
		return true;
	}

	if ( value === 'false' )
	{
		return false;
	}

	return value;
}

export class ListProductsQueryDto
{
	@IsOptional() @Type( () => Number ) @IsInt() @Min( PAGE_MIN ) page = PAGE_DEFAULT;

	@IsOptional() @Type( () => Number ) @IsInt() @Min( LIMIT_MIN ) @Max( LIMIT_MAX ) limit = LIMIT_DEFAULT;

	@IsOptional() @IsString() search?: string;

	@IsOptional() @IsEnum( ProductStatus ) status?: ProductStatus;

	@IsOptional() @Type( () => Number ) @IsInt() @Min( PRICE_MIN_AMOUNT ) minPrice?: number;

	@IsOptional() @Type( () => Number ) @IsInt() @Min( PRICE_MIN_AMOUNT ) maxPrice?: number;

	@IsOptional() @Transform( ( { value } ) => toBoolean( value ) ) @IsBoolean() inStockOnly?: boolean;

	@IsOptional() @IsMongoId() categoryId?: string;
}