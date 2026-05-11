import {RepositoryOptions} from '@/common/types/repository-options.type';
import {DatabaseService} from '@/database/database.service';
import {Injectable, OnModuleInit} from '@nestjs/common';
import {Collection, ObjectId} from 'mongodb';

import {CartDocument, CartRecord} from './types/cart-document.type';

@Injectable() export class CartsRepository implements OnModuleInit
{
	private readonly carts: Collection< CartDocument >;

	constructor( private readonly databaseService: DatabaseService )
	{
		this.carts = this.databaseService.collection< CartDocument >( 'carts' );
	}

	async onModuleInit(): Promise< void >
	{
		await this.ensureIndexes();
	}

	async findByUserId(
	    userId: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< CartRecord|null >
	{
		return this.carts.findOne(
		    { userId },
		    {
			    session : options?.session,
		    },
		);
	}

	async addItem(
	    userId: ObjectId,
	    productId: ObjectId,
	    quantity: number,
	    ): Promise< CartRecord >
	{
		const now = new Date();

		await this.carts.updateOne(
			{ userId },
			[
				{
					$set: {
						userId: {
							$ifNull: ['$userId', userId],
						},
						createdAt: {
							$ifNull: ['$createdAt', now],
						},
						updatedAt: now,
						items: {
							$let: {
								vars: {
									currentItems: {
										$ifNull: ['$items', []],
									},
								},
								in: {
									$cond: [
										{
											$in: [
												productId,
												{
													$map: {
														input: '$$currentItems',
														as: 'item',
														in: '$$item.productId',
													},
												},
											],
										},
										{
											$map: {
												input: '$$currentItems',
												as: 'item',
												in: {
													$cond: [
														{
															$eq: ['$$item.productId', productId],
														},
														{
															$mergeObjects: [
																'$$item',
																{
																	quantity: {
																		$add: ['$$item.quantity', quantity],
																	},
																	updatedAt: now,
																},
															],
														},
														'$$item',
													],
												},
											},
										},
										{
											$concatArrays: [
												'$$currentItems',
												[
													{
														productId,
														quantity,
														addedAt: now,
														updatedAt: now,
													},
												],
											],
										},
									],
								},
							},
						},
					},
				},
			],
			{
				upsert: true,
			},
		);

		const cart = await this.findByUserId( userId );

		if ( !cart )
		{
			throw new Error( 'Cart was not created' );
		}

		return cart;
	}

	async setItemQuantity(
	    userId: ObjectId,
	    productId: ObjectId,
	    quantity: number,
	    ): Promise< CartRecord >
	{
		const now = new Date();

		await this.carts.updateOne(
			{ userId },
			[
				{
					$set: {
						userId: {
							$ifNull: ['$userId', userId],
						},
						createdAt: {
							$ifNull: ['$createdAt', now],
						},
						updatedAt: now,
						items: {
							$let: {
								vars: {
									currentItems: {
										$ifNull: ['$items', []],
									},
								},
								in: {
									$cond: [
										{
											$in: [
												productId,
												{
													$map: {
														input: '$$currentItems',
														as: 'item',
														in: '$$item.productId',
													},
												},
											],
										},
										{
											$map: {
												input: '$$currentItems',
												as: 'item',
												in: {
													$cond: [
														{
															$eq: ['$$item.productId', productId],
														},
														{
															$mergeObjects: [
																'$$item',
																{
																	quantity,
																	updatedAt: now,
																},
															],
														},
														'$$item',
													],
												},
											},
										},
										{
											$concatArrays: [
												'$$currentItems',
												[
													{
														productId,
														quantity,
														addedAt: now,
														updatedAt: now,
													},
												],
											],
										},
									],
								},
							},
						},
					},
				},
			],
			{
				upsert: true,
			},
		);

		const cart = await this.findByUserId( userId );

		if ( !cart )
		{
			throw new Error( 'Cart was not created' );
		}

		return cart;
	}

	async removeItem( userId: ObjectId, productId: ObjectId ): Promise< void >
	{
		await this.carts.updateOne(
		    { userId },
		    {
			    $pull : {
				    items : {
					    productId,
				    },
			    },
			    $set : {
				    updatedAt : new Date(),
			    },
		    },
		);
	}

	async clear(
	    userId: ObjectId,
	    options?: RepositoryOptions,
	    ): Promise< void >
	{
		await this.carts.updateOne(
		    { userId },
		    {
			    $set : {
				    items : [],
				    updatedAt : new Date(),
			    },
		    },
		    {
			    session : options?.session,
		    },
		);
	}

	private async ensureIndexes(): Promise< void >
	{
		await this.carts.createIndex(
		    { userId : 1 },
		    {
			    unique : true,
			    name : 'uq_carts_user_id',
		    },
		);

		await this.carts.createIndex(
		    { 'items.productId' : 1 },
		    {
			    name : 'ix_carts_items_product_id',
		    },
		);
	}
}