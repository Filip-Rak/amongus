import {Currency} from '@/products/types/currency.enum';
import {ObjectId, WithId} from 'mongodb';

import {OrderStatus} from './order-status.enum';
import {PurchaseType} from './purchase-type.enum';

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

export interface OrderCompanyDetailsSnapshot {
	companyName: string;
	taxId: string;
}

export interface OrderInvoiceSnapshot {
	requested: boolean;
	billingAddressSameAsShipping: boolean;
	billingAddress?: OrderAddressSnapshot;
	companyDetails?: OrderCompanyDetailsSnapshot;
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

	purchaseType: PurchaseType;
	invoice: OrderInvoiceSnapshot;

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