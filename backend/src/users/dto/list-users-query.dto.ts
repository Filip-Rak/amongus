import {LIMIT_DEFAULT, LIMIT_MAX, LIMIT_MIN, PAGE_DEFAULT, PAGE_MIN} from '@/common/validation/validation-limits';
import {Type} from 'class-transformer';
import {IsEnum, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';

import {UserRole} from '../types/user-role.enum';

export class ListUsersQueryDto
{
	@IsOptional() @Type( () => Number ) @IsInt() @Min( PAGE_MIN ) page = PAGE_DEFAULT;

	@IsOptional() @Type( () => Number ) @IsInt() @Min( LIMIT_MIN ) @Max( LIMIT_MAX ) limit = LIMIT_DEFAULT;

	@IsOptional() @IsEnum( UserRole ) role?: UserRole;

	@IsOptional() @IsString() search?: string;
}