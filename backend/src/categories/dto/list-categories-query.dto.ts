import {CategoryStatus} from '@/categories/types/category-status.enum';
import {LIMIT_DEFAULT, LIMIT_MAX, LIMIT_MIN, PAGE_DEFAULT, PAGE_MIN} from '@/common/validation/validation-limits';
import {Type} from 'class-transformer';
import {IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateIf} from 'class-validator';

export class ListCategoriesQueryDto
{
	@IsOptional() @Type( () => Number ) @IsInt() @Min( PAGE_MIN ) page = PAGE_DEFAULT;

	@IsOptional() @Type( () => Number ) @IsInt() @Min( LIMIT_MIN ) @Max( LIMIT_MAX ) limit = LIMIT_DEFAULT;

	@IsOptional() @IsString() search?: string;

	@IsOptional() @IsEnum( CategoryStatus ) status?: CategoryStatus;

	@IsOptional() @ValidateIf( ( _, value: unknown ) => value !== 'root' ) @IsString() parentId?: string;
}