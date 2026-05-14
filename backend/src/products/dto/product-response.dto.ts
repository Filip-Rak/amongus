import {
	ProductAttributeValue,
	ProductImage,
	ProductPrice,
} from '../types/product-document.type';
import {ProductStatus} from '../types/product-status.enum';

export interface ProductResponseDto {
	id: string;
	name: string;
	slug: string;
	description: string;

	price: ProductPrice;
	stock: number;

	images: ProductImage[];
	attributes: Record< string, ProductAttributeValue >;

	status: ProductStatus;

	averageRating: number;
	reviewCount: number;

	categoryId?: string;

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