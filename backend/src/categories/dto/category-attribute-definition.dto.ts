import {trimLowercaseString, trimString} from '@/common/transformers/string.transformers';
import {
	CATEGORY_ATTRIBUTE_ALLOWED_VALUE_MAX_LENGTH,
	CATEGORY_ATTRIBUTE_ALLOWED_VALUES_MAX_COUNT,
	CATEGORY_ATTRIBUTE_KEY_MAX_LENGTH,
	CATEGORY_ATTRIBUTE_KEY_MIN_LENGTH,
	CATEGORY_ATTRIBUTE_LABEL_MAX_LENGTH,
	CATEGORY_ATTRIBUTE_LABEL_MIN_LENGTH,
	CATEGORY_ATTRIBUTE_UNIT_MAX_LENGTH
} from '@/common/validation/validation-limits';
import {Transform} from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsBoolean,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength
} from 'class-validator';

import {CategoryAttributeType} from '../types/category-attribute-type.enum';

export class CategoryAttributeDefinitionDto
{
	@Transform( trimLowercaseString )
	@IsString()
	@MinLength( CATEGORY_ATTRIBUTE_KEY_MIN_LENGTH )
	@MaxLength( CATEGORY_ATTRIBUTE_KEY_MAX_LENGTH )
	@Matches( /^[a-z][a-z0-9_]*$/ )
	key: string;

	@Transform( trimString )
	@IsString()
	@MinLength( CATEGORY_ATTRIBUTE_LABEL_MIN_LENGTH )
	@MaxLength( CATEGORY_ATTRIBUTE_LABEL_MAX_LENGTH )
	label: string;

	@IsEnum( CategoryAttributeType ) type: CategoryAttributeType;

	@IsBoolean() isRequired: boolean;

	@IsOptional()
	@IsArray()
	@ArrayMaxSize( CATEGORY_ATTRIBUTE_ALLOWED_VALUES_MAX_COUNT )
	@IsString( { each : true } )
	@MaxLength( CATEGORY_ATTRIBUTE_ALLOWED_VALUE_MAX_LENGTH, { each : true } )
	allowedValues?: string[];

	@IsOptional() @IsNumber() min?: number;

	@IsOptional() @IsNumber() max?: number;

	@IsOptional() @Transform( trimString ) @IsString() @MaxLength( CATEGORY_ATTRIBUTE_UNIT_MAX_LENGTH ) unit?: string;
}