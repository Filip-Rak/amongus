import {CategoryStatus} from '../types/category-status.enum';

export interface CategoryResponseDto {
	id: string;
	name: string;
	slug: string;
	description?: string;

	status: CategoryStatus;

	createdAt: string;
	updatedAt: string;
	archivedAt?: string;
}

export interface PaginatedCategoriesResponseDto {
	items: CategoryResponseDto[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}