import {WithId} from 'mongodb';

import {Currency} from './currency.enum';
import {ProductStatus} from './product-status.enum';

export type ProductAttributeValue = string|number|boolean|string[];

export interface ProductPrice {
	amount: number;
	currency: Currency;
}

export interface ProductImage {
	url: string;
	alt?: string;
	isPrimary: boolean;
}

export interface ProductDocument {
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

	createdAt: Date;
	updatedAt: Date;
	archivedAt?: Date;
}
export type ProductRecord = WithId< ProductDocument >;