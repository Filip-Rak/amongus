import {Transform, Type} from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsEnum,
	IsInt,
	IsObject,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from 'class-validator';

import {ProductAttributeValue} from '../types/product-document.type';
import {ProductStatus} from '../types/product-status.enum';

import {ProductImageDto} from './product-image.dto';
import {ProductPriceDto} from './product-price.dto';

export class UpdateProductDto
{
	@IsOptional()
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform( ( { value } ) => typeof value === 'string' ? value.trim() : value )
	@IsString()
	@MinLength( 1 )
	@MaxLength( 150 )
	name?: string;

	@IsOptional()
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform( ( { value } ) => typeof value === 'string' ? value.trim().toLowerCase() : value )
	@IsString()
	@MinLength( 1 )
	@MaxLength( 180 )
	@Matches( /^[a-z0-9]+(?:-[a-z0-9]+)*$/ )
	slug?: string;

	@IsOptional()
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	@Transform( ( { value } ) => typeof value === 'string' ? value.trim() : value )
	@IsString()
	@MinLength( 1 )
	@MaxLength( 5000 )
	description?: string;

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
}