import {Type} from 'class-transformer';
import {IsEnum, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';

import {UserRole} from '../types/user-role.enum';

export class ListUsersQueryDto
{
	@IsOptional() @Type( () => Number ) @IsInt() @Min( 1 ) page = 1;

	@IsOptional() @Type( () => Number ) @IsInt() @Min( 1 ) @Max( 100 ) limit = 20;

	@IsOptional() @IsEnum( UserRole ) role?: UserRole;

	@IsOptional() @IsString() search?: string;
}