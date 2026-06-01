import {ProductAttributeValue, ProductImage, ProductPrice} from '@/products/types/product-document.type';
import {ProductStatus} from '@/products/types/product-status.enum';

export interface ProductListImageResponseDto {
	url: string;
	alt?: string;
}

export interface ProductListItemResponseDto {
	id: string;
	name: string;
	slug: string;
	description: string;
	price: ProductPrice;
	image: ProductListImageResponseDto|null;
}

export interface PaginatedProductListResponseDto {
	items: ProductListItemResponseDto[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ProductResponseDto {
	id: string;
	name: string;
	slug: string;
	description: string;

	price: ProductPrice;
	stock: number;

	categoryId: string;

	images: ProductImage[];
	attributeValues: Record< string, ProductAttributeValue >;

	status: ProductStatus;

	averageRating: number;
	reviewCount: number;

	createdAt: string;
	updatedAt: string;
	archivedAt?: string;
}

export interface PaginatedProductsResponseDto {
	items: ProductResponseDto[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}