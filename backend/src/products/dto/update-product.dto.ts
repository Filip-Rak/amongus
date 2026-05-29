import {trimLowercaseString, trimString} from '@/common/transformers/string.transformers';
import {
	PRODUCT_DESCRIPTION_MAX_LENGTH,
	PRODUCT_IMAGES_MAX_COUNT,
	PRODUCT_NAME_MAX_LENGTH,
	PRODUCT_SLUG_MAX_LENGTH,
	STOCK_MIN,
	TEXT_MIN_LENGTH
} from '@/common/validation/validation-limits';
import {ProductAttributeValue} from '@/products/types/product-document.type';
import {ProductStatus} from '@/products/types/product-status.enum';
import {Transform, Type} from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsEnum,
	IsInt,
	IsMongoId,
	IsObject,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	Min,
	MinLength,
	ValidateNested
} from 'class-validator';

import {ProductImageDto} from './product-image.dto';
import {ProductPriceDto} from './product-price.dto';

export class UpdateProductDto
{
	@IsOptional()
	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( PRODUCT_NAME_MAX_LENGTH )
	name?: string;

	@IsOptional()
	@Transform( trimLowercaseString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( PRODUCT_SLUG_MAX_LENGTH )
	@Matches( /^[a-z0-9]+(?:-[a-z0-9]+)*$/ )
	slug?: string;

	@IsOptional()
	@Transform( trimLowercaseString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( PRODUCT_DESCRIPTION_MAX_LENGTH )
	description?: string;

	@IsOptional() @ValidateNested() @Type( () => ProductPriceDto ) price?: ProductPriceDto;

	@IsOptional() @IsInt() @Min( STOCK_MIN ) stock?: number;

	@IsOptional()
	@IsArray()
	@ArrayMaxSize( PRODUCT_IMAGES_MAX_COUNT )
	@ValidateNested( { each : true } )
	@Type( () => ProductImageDto )
	images?: ProductImageDto[];

	@IsOptional() @IsObject() attributeValues?: Record< string, ProductAttributeValue >;

	@IsOptional() @IsEnum( ProductStatus ) status?: ProductStatus;

	@IsOptional() @IsMongoId() categoryId?: string;
}