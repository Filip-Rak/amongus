import {CategoryAttributeDefinition} from '@/categories/types/category-document.type';
import {CategoryStatus} from '@/categories/types/category-status.enum';

export interface CategoryResponseDto {
	id: string;
	name: string;
	slug: string;

	parentId?: string;
	ancestorIds: string[];
	level: number;

	description?: string;
	status: CategoryStatus;

	attributeDefinitions: CategoryAttributeDefinition[];

	createdAt: string;
	updatedAt: string;
	archivedAt?: string;
}

export interface CategoryTreeResponseDto extends CategoryResponseDto {
	children: CategoryTreeResponseDto[];
}

export interface CategoryInheritedAttributesResponseDto {
	categoryId: string;
	attributes: CategoryAttributeDefinition[];
}

export interface PaginatedCategoriesResponseDto {
	items: CategoryResponseDto[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}