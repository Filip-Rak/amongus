import {Currency} from '@/products/types/currency.enum';
import {ObjectId, WithId} from 'mongodb';

import {PaymentProvider} from './payment-provider.enum';
import {PaymentStatus} from './payment-status.enum';

export interface PaymentDocument {
	orderId: ObjectId;
	userId: ObjectId;

	provider: PaymentProvider;
	status: PaymentStatus;

	amount: number;
	currency: Currency;

	mockTransactionId?: string;
	failureReason?: string;

	createdAt: Date;
	updatedAt: Date;
	paidAt?: Date;
	failedAt?: Date;
}

export type PaymentRecord = WithId< PaymentDocument >;