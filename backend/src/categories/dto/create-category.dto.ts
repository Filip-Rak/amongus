import {trimLowercaseString, trimString} from '@/common/transformers/string.transformers';
import {Transform} from 'class-transformer';
import {IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength} from 'class-validator';

import {CategoryStatus} from '../types/category-status.enum';

export class CreateCategoryDto
{
	@Transform( trimString ) @IsString() @MinLength( 1 ) @MaxLength( 100 ) name: string;

	@IsOptional()
	@Transform( trimLowercaseString )
	@IsString()
	@MinLength( 1 )
	@MaxLength( 120 )
	@Matches( /^[a-z0-9]+(?:-[a-z0-9]+)*$/ )
	slug?: string;

	@IsOptional() @Transform( trimString ) @IsString() @MinLength( 1 ) @MaxLength( 1000 ) description?: string;

	@IsOptional() @IsEnum( CategoryStatus ) status?: CategoryStatus;
}