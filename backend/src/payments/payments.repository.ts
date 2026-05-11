import {RepositoryOptions} from '@/common/types/repository-options.type';
import {DatabaseService} from '@/database/database.service';
import {Currency} from '@/products/types/currency.enum';
import {Injectable, OnModuleInit} from '@nestjs/common';
import {randomUUID} from 'crypto';
import {Collection, ObjectId} from 'mongodb';

import {PaymentDocument, PaymentRecord} from './types/payment-document.type';
import {PaymentProvider} from './types/payment-provider.enum';
import {PaymentStatus} from './types/payment-status.enum';

export interface CreateMockPaymentInput {
	orderId: ObjectId;
	userId: ObjectId;
	amount: number;
	currency: Currency;
}

@Injectable() export class PaymentsRepository implements OnModuleInit
{
	private readonly payments: Collection< PaymentDocument >;

	constructor( private readonly databaseService: DatabaseService )
	{
		this.payments = this.databaseService.collection< PaymentDocument >( 'payments' );
	}

	async onModuleInit(): Promise< void >
	{
		await this.ensureIndexes();
	}

	private async ensureIndexes(): Promise< void >
	{
		await this.payments.createIndex(
		    { orderId : 1 },
		    {
			    unique : true,
			    name : 'uq_payments_order_id',
		    },
		);

		await this.payments.createIndex(
		    { userId : 1, createdAt : -1 },
		    {
			    name : 'ix_payments_user_id_created_at',
		    },
		);

		await this.payments.createIndex(
		    { status : 1, createdAt : -1 },
		    {
			    name : 'ix_payments_status_created_at',
		    },
		);
	}

	async createPendingMock(
	    input: CreateMockPaymentInput,
	    options?: RepositoryOptions,
	    ): Promise< PaymentRecord >
	{
		const now = new Date();

		const document: PaymentDocument = {
			orderId : input.orderId,
			userId : input.userId,
			provider : PaymentProvider.Mock,
			status : PaymentStatus.Pending,
			amount : input.amount,
			currency : input.currency,
			createdAt : now,
			updatedAt : now,
		};

		const result = await this.payments.insertOne( document, {
			session : options?.session,
		} );

		return {
			_id : result.insertedId,
			...document,
		};
	}

	async findById(
	    id: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< PaymentRecord|null >
	{
		return this.payments.findOne(
		    { _id : id },
		    {
			    session : options?.session,
		    },
		);
	}

	async markPaid(
	    id: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< PaymentRecord|null >
	{
		const now = new Date();

		return this.payments.findOneAndUpdate(
		    {
			    _id : id,
			    status : PaymentStatus.Pending,
		    },
		    {
			    $set : {
				    status : PaymentStatus.Paid,
				    mockTransactionId : randomUUID(),
				    paidAt : now,
				    updatedAt : now,
			    },
		    },
		    {
			    session : options?.session,
			    returnDocument : 'after',
			    includeResultMetadata : false,
		    },
		);
	}

	async markFailed(
	    id: ObjectId,
	    reason: string,
	    options?: RepositoryOptions,
	    ): Promise< PaymentRecord|null >
	{
		const now = new Date();

		return this.payments.findOneAndUpdate(
		    {
			    _id : id,
			    status : PaymentStatus.Pending,
		    },
		    {
			    $set : {
				    status : PaymentStatus.Failed,
				    failureReason : reason,
				    failedAt : now,
				    updatedAt : now,
			    },
		    },
		    {
			    session : options?.session,
			    returnDocument : 'after',
			    includeResultMetadata : false,
		    },
		);
	}
}