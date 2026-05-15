import {trimString} from '@/common/transformers/string.transformers';
import {
	RATING_MAX,
	RATING_MIN,
	REVIEW_COMMENT_MAX_LENGTH,
	REVIEW_TITLE_MAX_LENGTH,
	TEXT_MIN_LENGTH
} from '@/common/validation/validation-limits';
import {Transform} from 'class-transformer';
import {IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength} from 'class-validator';

export class CreateReviewDto
{
	@IsInt() @Min( RATING_MIN ) @Max( RATING_MAX ) rating: number;

	@IsOptional()
	@Transform( trimString )
	@IsString()
	@MinLength( TEXT_MIN_LENGTH )
	@MaxLength( REVIEW_TITLE_MAX_LENGTH )
	title?: string;

	@IsOptional()
	@Transform( trimString )
	@IsString()
	@MinLength( 1 )
	@MaxLength( REVIEW_COMMENT_MAX_LENGTH )
	comment?: string;
}