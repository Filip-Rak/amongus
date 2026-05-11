import {PaymentResponseDto} from '@/payments/dto/payment-response.dto';
import {Currency} from '@/products/types/currency.enum';

import {
	OrderAddressSnapshot,
	OrderTotals,
} from '../types/order-document.type';
import {OrderStatus} from '../types/order-status.enum';

export interface OrderItemResponseDto {
	productId: string;
	productName: string;
	productSlug: string;
	unitPriceAmount: number;
	currency: Currency;
	quantity: number;
	imageUrl?: string;
}

export interface OrderResponseDto {
	id: string;
	userId: string;
	status: OrderStatus;

	items: OrderItemResponseDto[];
	shippingAddress: OrderAddressSnapshot;
	totals: OrderTotals;

	paymentId?: string;

	createdAt: string;
	updatedAt: string;
	paidAt?: string;
	cancelledAt?: string;
}

export interface CheckoutResponseDto {
	order: OrderResponseDto;
	payment: PaymentResponseDto;
}