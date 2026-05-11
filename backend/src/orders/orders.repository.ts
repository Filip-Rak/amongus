import {RepositoryOptions} from '@/common/types/repository-options.type';
import {DatabaseService} from '@/database/database.service';
import {Injectable, OnModuleInit} from '@nestjs/common';
import {Collection, ObjectId} from 'mongodb';

import {
	OrderAddressSnapshot,
	OrderDocument,
	OrderItemSnapshot,
	OrderRecord,
	OrderTotals
} from './types/order-document.type';
import {OrderStatus} from './types/order-status.enum';

export interface CreateOrderInput {
	userId: ObjectId;
	items: OrderItemSnapshot[];
	shippingAddress: OrderAddressSnapshot;
	totals: OrderTotals;
}

@Injectable() export class OrdersRepository implements OnModuleInit
{
	private readonly orders: Collection< OrderDocument >;

	constructor( private readonly databaseService: DatabaseService )
	{
		this.orders = this.databaseService.collection< OrderDocument >( 'orders' );
	}

	async onModuleInit(): Promise< void >
	{
		await this.ensureIndexes();
	}

	private async ensureIndexes(): Promise< void >
	{
		await this.orders.createIndex(
		    { userId : 1, createdAt : -1 },
		    {
			    name : 'ix_orders_user_id_created_at',
		    },
		);

		await this.orders.createIndex(
		    { status : 1, createdAt : -1 },
		    {
			    name : 'ix_orders_status_created_at',
		    },
		);

		await this.orders.createIndex(
		    { 'items.productId' : 1 },
		    {
			    name : 'ix_orders_items_product_id',
		    },
		);

		await this.orders.createIndex(
		    { paymentId : 1 },
		    {
			    name : 'ix_orders_payment_id',
			    sparse : true,
		    },
		);
	}

	async create(
	    input: CreateOrderInput,
	    options?: RepositoryOptions,
	    ): Promise< OrderRecord >
	{
		const now = new Date();

		const document: OrderDocument = {
			userId : input.userId,
			status : OrderStatus.PendingPayment,
			items : input.items,
			shippingAddress : input.shippingAddress,
			totals : input.totals,
			createdAt : now,
			updatedAt : now,
		};

		const result = await this.orders.insertOne( document, {
			session : options?.session,
		} );

		return {
			_id : result.insertedId,
			...document,
		};
	}

	async attachPayment(
	    orderId: ObjectId,
	    paymentId: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< OrderRecord|null >
	{
		return this.orders.findOneAndUpdate(
		    { _id : orderId },
		    {
			    $set : {
				    paymentId,
				    updatedAt : new Date(),
			    },
		    },
		    {
			    session : options?.session,
			    returnDocument : 'after',
			    includeResultMetadata : false,
		    },
		);
	}

	async findByUserId(
	    userId: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< OrderRecord[] >
	{
		return this.orders
		    .find(
		        { userId },
		        {
			        session : options?.session,
		        },
		        )
		    .sort( { createdAt : -1 } )
		    .toArray();
	}

	async findByIdForUser(
	    id: ObjectId,
	    userId: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< OrderRecord|null >
	{
		return this.orders.findOne(
		    {
			    _id : id,
			    userId,
		    },
		    {
			    session : options?.session,
		    },
		);
	}

	async markPaid(
	    orderId: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< OrderRecord|null >
	{
		const now = new Date();

		return this.orders.findOneAndUpdate(
		    {
			    _id : orderId,
			    status : OrderStatus.PendingPayment,
		    },
		    {
			    $set : {
				    status : OrderStatus.Paid,
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

	async markPaymentFailed(
	    orderId: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< OrderRecord|null >
	{
		return this.orders.findOneAndUpdate(
		    {
			    _id : orderId,
			    status : OrderStatus.PendingPayment,
		    },
		    {
			    $set : {
				    status : OrderStatus.PaymentFailed,
				    updatedAt : new Date(),
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