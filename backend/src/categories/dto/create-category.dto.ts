import {CategoryStatus} from '@/categories/types/category-status.enum';
import {
	trimLowercaseString,
	trimString,
} from '@/common/transformers/string.transformers';
import {
	CATEGORY_ATTRIBUTES_MAX_COUNT,
	CATEGORY_DESCRIPTION_MAX_LENGTH,
	CATEGORY_NAME_MAX_LENGTH,
	CATEGORY_SLUG_MAX_LENGTH,
	TEXT_MIN_LENGTH,
} from '@/common/validation/validation-limits';
import {Transform, Type} from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsEnum,
	IsMongoId,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';

import {CategoryAttributeDefinitionDto} from './category-attribute-definition.dto';

export class CreateCategoryDto
{
	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( CATEGORY_NAME_MAX_LENGTH )
	name: string;

	@IsOptional()
	@Transform( trimLowercaseString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( CATEGORY_SLUG_MAX_LENGTH )
	@Matches( /^[a-z0-9]+(?:-[a-z0-9]+)*$/ )
	slug?: string;

	@IsOptional() @IsMongoId() parentId?: string;

	@IsOptional()
	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( CATEGORY_DESCRIPTION_MAX_LENGTH )
	description?: string;

	@IsOptional() @IsEnum( CategoryStatus ) status?: CategoryStatus;

	@IsOptional()
	@IsArray()
	@ArrayMaxSize( CATEGORY_ATTRIBUTES_MAX_COUNT )
	@ValidateNested( { each : true } )
	@Type( () => CategoryAttributeDefinitionDto )
	attributeDefinitions?: CategoryAttributeDefinitionDto[];
}