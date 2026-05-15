import {PaymentProvider} from '@/payments/types/payment-provider.enum';
import {PaymentStatus} from '@/payments/types/payment-status.enum';
import {Currency} from '@/products/types/currency.enum';

export interface PaymentResponseDto {
	id: string;

	orderId: string;
	userId: string;

	provider: PaymentProvider;
	status: PaymentStatus;

	amount: number;
	currency: Currency;

	mockTransactionId?: string;
	failureReason?: string;

	createdAt: string;
	updatedAt: string;
	paidAt?: string;
	failedAt?: string;
}