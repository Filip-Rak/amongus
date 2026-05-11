import {Transform, Type} from 'class-transformer';
import {
	IsBoolean,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';

import {ProductStatus} from '../types/product-status.enum';

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
	@IsOptional() @Type( () => Number ) @IsInt() @Min( 1 ) page = 1;

	@IsOptional() @Type( () => Number ) @IsInt() @Min( 1 ) @Max( 100 ) limit = 20;

	@IsOptional() @IsString() search?: string;

	@IsOptional() @IsEnum( ProductStatus ) status?: ProductStatus;

	@IsOptional() @Type( () => Number ) @IsInt() @Min( 0 ) minPrice?: number;

	@IsOptional() @Type( () => Number ) @IsInt() @Min( 0 ) maxPrice?: number;

	@IsOptional() @Transform( ( { value } ) => toBoolean( value ) ) @IsBoolean() inStockOnly?: boolean;
}