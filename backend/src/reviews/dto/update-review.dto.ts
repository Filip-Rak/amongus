import {trimString} from '@/common/transformers/string.transformers';
import {Transform} from 'class-transformer';
import {
	IsInt,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator';

export class UpdateReviewDto
{
	@IsOptional() @IsInt() @Min( 1 ) @Max( 5 ) rating?: number;

	@IsOptional() @Transform( trimString ) @IsString() @MinLength( 1 ) @MaxLength( 120 ) title?: string;

	@IsOptional() @Transform( trimString ) @IsString() @MinLength( 1 ) @MaxLength( 2000 ) comment?: string;
}