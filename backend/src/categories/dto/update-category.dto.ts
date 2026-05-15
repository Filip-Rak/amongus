import {CategoryStatus} from '@/categories/types/category-status.enum';
import {trimLowercaseString, trimString} from '@/common/transformers/string.transformers';
import {
	CATEGORY_DESCRIPTION_MAX_LENGTH,
	CATEGORY_NAME_MAX_LENGTH,
	CATEGORY_SLUG_MAX_LENGTH,
	TEXT_MIN_LENGTH
} from '@/common/validation/validation-limits';
import {Transform} from 'class-transformer';
import {IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength} from 'class-validator';

export class UpdateCategoryDto
{
	@IsOptional()
	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( CATEGORY_NAME_MAX_LENGTH )
	name?: string;

	@IsOptional()
	@Transform( trimLowercaseString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( CATEGORY_SLUG_MAX_LENGTH )
	@Matches( /^[a-z0-9]+(?:-[a-z0-9]+)*$/ )
	slug?: string;

	@IsOptional()
	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( CATEGORY_DESCRIPTION_MAX_LENGTH )
	description?: string;

	@IsOptional() @IsEnum( CategoryStatus ) status?: CategoryStatus;
}