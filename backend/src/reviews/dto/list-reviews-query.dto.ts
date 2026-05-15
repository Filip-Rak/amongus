import {LIMIT_DEFAULT, LIMIT_MAX, LIMIT_MIN, PAGE_DEFAULT, PAGE_MIN} from '@/common/validation/validation-limits';
import {Type} from 'class-transformer';
import {IsInt, IsOptional, Max, Min} from 'class-validator';

export class ListReviewsQueryDto
{
	@IsOptional() @Type( () => Number ) @IsInt() @Min( PAGE_MIN ) page = PAGE_DEFAULT;

	@IsOptional() @Type( () => Number ) @IsInt() @Min( LIMIT_MIN ) @Max( LIMIT_MAX ) limit = LIMIT_DEFAULT;
}