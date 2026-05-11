import {Currency} from '@/products/types/currency.enum';
import {ProductPrice} from '@/products/types/product-document.type';

export interface CartProductSummaryDto {
	id: string;
	name: string;
	slug: string;
	price: ProductPrice;
	stock: number;
	imageUrl?: string;
}

export interface CartItemResponseDto {
	productId: string;
	quantity: number;
	addedAt: string;
	updatedAt: string;
	isAvailable: boolean;
	lineTotalAmount: number|null;
	product: CartProductSummaryDto|null;
}

export interface CartTotalDto {
	currency: Currency;
	amount: number;
}

export interface CartResponseDto {
	id: string|null;
	userId: string;
	items: CartItemResponseDto[];
	totalQuantity: number;
	totals: CartTotalDto[];
	createdAt: string|null;
	updatedAt: string|null;
}