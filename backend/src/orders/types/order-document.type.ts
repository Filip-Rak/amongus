import {Currency} from '@/products/types/currency.enum';
import {ObjectId, WithId} from 'mongodb';

import {OrderStatus} from './order-status.enum';

export interface OrderItemSnapshot {
	productId: ObjectId;
	productName: string;
	productSlug: string;
	unitPriceAmount: number;
	currency: Currency;
	quantity: number;
	imageUrl?: string;
}

export interface OrderAddressSnapshot {
	fullName: string;
	line1: string;
	line2?: string;
	city: string;
	postalCode: string;
	country: string;
	phone?: string;
}

export interface OrderTotals {
	subtotalAmount: number;
	shippingAmount: number;
	totalAmount: number;
	currency: Currency;
}

export interface OrderDocument {
	userId: ObjectId;
	status: OrderStatus;

	items: OrderItemSnapshot[];
	shippingAddress: OrderAddressSnapshot;
	totals: OrderTotals;

	paymentId?: ObjectId;

	createdAt: Date;
	updatedAt: Date;
	paidAt?: Date;
	cancelledAt?: Date;
}

export type OrderRecord = WithId< OrderDocument >;