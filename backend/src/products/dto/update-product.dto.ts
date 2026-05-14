import {trimLowercaseString, trimString} from '@/common/transformers/string.transformers';
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

import {ProductAttributeValue} from '../types/product-document.type';
import {ProductStatus} from '../types/product-status.enum';

import {ProductImageDto} from './product-image.dto';
import {ProductPriceDto} from './product-price.dto';

export class UpdateProductDto
{
	@IsOptional() @Transform( trimString ) @IsString() @MinLength( 1 ) @MaxLength( 150 ) name?: string;

	@IsOptional()
	@Transform( trimLowercaseString )
	@IsString()
	@MinLength( 1 )
	@MaxLength( 180 )
	@Matches( /^[a-z0-9]+(?:-[a-z0-9]+)*$/ )
	slug?: string;

	@IsOptional() @Transform( trimLowercaseString ) @IsString() @MinLength( 1 ) @MaxLength( 5000 ) description?: string;

	@IsOptional() @ValidateNested() @Type( () => ProductPriceDto ) price?: ProductPriceDto;

	@IsOptional() @IsInt() @Min( 0 ) stock?: number;

	@IsOptional()
	@IsArray()
	@ArrayMaxSize( 10 )
	@ValidateNested( { each : true } )
	@Type( () => ProductImageDto )
	images?: ProductImageDto[];

	@IsOptional() @IsObject() attributes?: Record< string, ProductAttributeValue >;

	@IsOptional() @IsEnum( ProductStatus ) status?: ProductStatus;

	@IsOptional() @IsMongoId() categoryId?: string;
}