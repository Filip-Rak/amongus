import {Type} from 'class-transformer';
import {IsEnum, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';

import {CategoryStatus} from '../types/category-status.enum';

export class ListCategoriesQueryDto
{
	@IsOptional() @Type( () => Number ) @IsInt() @Min( 1 ) page = 1;

	@IsOptional() @Type( () => Number ) @IsInt() @Min( 1 ) @Max( 100 ) limit = 20;

	@IsOptional() @IsString() search?: string;

	@IsOptional() @IsEnum( CategoryStatus ) status?: CategoryStatus;
}