import {isMongoNamespaceNotFoundError} from '@/common/mongo/mongo-errors';
import {Injectable, Logger, OnModuleInit} from '@nestjs/common';

import {DatabaseService} from './database.service';

@Injectable() export class DatabaseValidationService implements OnModuleInit
{
	private readonly logger = new Logger( DatabaseValidationService.name );

	constructor( private readonly databaseService: DatabaseService ) {}

	async onModuleInit(): Promise< void >
	{
		await this.applyUsersValidation();
		await this.applyProductsValidation();
		await this.applyCartsValidation();
		await this.applyOrdersValidation();
		await this.applyPaymentsValidation();
		await this.applyReviewsValidation();
		await this.applyCategoriesValidation();
	}

	private async applyUsersValidation(): Promise< void >
	{
		await this.applyCollectionValidator( 'users', {
			$jsonSchema : {
				bsonType : 'object',
				required : [
					'email',
					'passwordHash',
					'role',
					'status',
					'createdAt',
					'updatedAt',
				],
				properties : {
					email : {
						bsonType : 'string',
						description : 'email must be a string and is required',
					},
					passwordHash : {
						bsonType : 'string',
						description : 'passwordHash must be a string and is required',
					},
					role : {
						enum : [ 'admin', 'user' ],
						description : 'role must be either admin or user',
					},
					status : {
						enum : [ 'active', 'deleted' ],
						description : 'status must be either active or deleted',
					},
					createdAt : {
						bsonType : 'date',
						description : 'createdAt must be a date and is required',
					},
					updatedAt : {
						bsonType : 'date',
						description : 'updatedAt must be a date and is required',
					},
					deletedAt : {
						bsonType : 'date',
						description : 'deletedAt must be a date when present',
					},
				},
			},
		} );
	}

	private async applyProductsValidation(): Promise< void >
	{
		await this.applyCollectionValidator( 'products', {
			$jsonSchema : {
				bsonType : 'object',
				required : [
					'name',
					'slug',
					'description',
					'price',
					'stock',
					'images',
					'attributes',
					'status',
					'averageRating',
					'reviewCount',
					'createdAt',
					'updatedAt',
				],
				properties : {
					name : {
						bsonType : 'string',
						minLength : 1,
						maxLength : 150,
						description : 'name must be a non-empty string',
					},
					slug : {
						bsonType : 'string',
						minLength : 1,
						maxLength : 180,
						pattern : '^[a-z0-9]+(?:-[a-z0-9]+)*$',
						description : 'slug must be a valid URL slug',
					},
					description : {
						bsonType : 'string',
						minLength : 1,
						maxLength : 5000,
						description : 'description must be a non-empty string',
					},
					price : {
						bsonType : 'object',
						required : [ 'amount', 'currency' ],
						properties : {
							amount : {
								bsonType : 'number',
								minimum : 0,
								description : 'price.amount must be a non-negative integer',
							},
							currency : {
								enum : [ 'PLN', 'EUR', 'USD' ],
								description : 'price.currency must be supported',
							},
						},
					},
					stock : {
						bsonType : 'number',
						minimum : 0,
						description : 'stock must be a non-negative integer',
					},
					images : {
						bsonType : 'array',
						maxItems : 10,
						items : {
							bsonType : 'object',
							required : [ 'url', 'isPrimary' ],
							properties : {
								url : {
									bsonType : 'string',
									description : 'image url must be a string',
								},
								alt : {
									bsonType : 'string',
									maxLength : 200,
									description : 'image alt must be a string when present',
								},
								isPrimary : {
									bsonType : 'bool',
									description : 'isPrimary must be a boolean',
								},
							},
						},
					},
					attributes : {
						bsonType : 'object',
						description : 'attributes must be an object',
					},
					categoryId : {
						bsonType : 'objectId',
					},
					status : {
						enum : [ 'draft', 'active', 'archived' ],
						description : 'status must be draft, active, or archived',
					},
					averageRating : {
						bsonType : [ 'double', 'int', 'long', 'decimal' ],
						minimum : 0,
						maximum : 5,
						description : 'averageRating must be between 0 and 5',
					},
					reviewCount : {
						bsonType : [ 'int', 'long' ],
						minimum : 0,
						description : 'reviewCount must be a non-negative integer',
					},
					createdAt : {
						bsonType : 'date',
						description : 'createdAt must be a date and is required',
					},
					updatedAt : {
						bsonType : 'date',
						description : 'updatedAt must be a date and is required',
					},
					archivedAt : {
						bsonType : 'date',
						description : 'archivedAt must be a date when present',
					},
				},
			},
		} );
	}

	private async applyCartsValidation(): Promise< void >
	{
		await this.applyCollectionValidator( 'carts', {
			$jsonSchema : {
				bsonType : 'object',
				required : [
					'userId',
					'items',
					'createdAt',
					'updatedAt',
				],
				properties : {
					userId : {
						bsonType : 'objectId',
						description : 'userId must be an ObjectId and is required',
					},
					items : {
						bsonType : 'array',
						maxItems : 100,
						items : {
							bsonType : 'object',
							required : [
								'productId',
								'quantity',
								'addedAt',
								'updatedAt',
							],
							properties : {
								productId : {
									bsonType : 'objectId',
									description : 'productId must be an ObjectId and is required',
								},
								quantity : {
									bsonType : 'number',
									minimum : 1,
									description : 'quantity must be a positive integer',
								},
								addedAt : {
									bsonType : 'date',
									description : 'addedAt must be a date and is required',
								},
								updatedAt : {
									bsonType : 'date',
									description : 'updatedAt must be a date and is required',
								},
							},
						},
					},
					createdAt : {
						bsonType : 'date',
						description : 'createdAt must be a date and is required',
					},
					updatedAt : {
						bsonType : 'date',
						description : 'updatedAt must be a date and is required',
					},
				},
			},
		} );
	}

	private async applyOrdersValidation(): Promise< void >
	{
		await this.applyCollectionValidator( 'orders', {
			$jsonSchema : {
				bsonType : 'object',
				required : [
					'userId',
					'status',
					'items',
					'shippingAddress',
					'totals',
					'createdAt',
					'updatedAt',
				],
				properties : {
					userId : {
						bsonType : 'objectId',
					},
					status : {
						enum : [
							'pending_payment',
							'paid',
							'payment_failed',
							'cancelled',
							'shipped',
							'completed',
						],
					},
					items : {
						bsonType : 'array',
						minItems : 1,
						items : {
							bsonType : 'object',
							required : [
								'productId',
								'productName',
								'productSlug',
								'unitPriceAmount',
								'currency',
								'quantity',
							],
							properties : {
								productId : {
									bsonType : 'objectId',
								},
								productName : {
									bsonType : 'string',
								},
								productSlug : {
									bsonType : 'string',
								},
								unitPriceAmount : {
									bsonType : 'number',
									minimum : 0,
								},
								currency : {
									enum : [ 'PLN', 'EUR', 'USD' ],
								},
								quantity : {
									bsonType : 'number',
									minimum : 1,
								},
								imageUrl : {
									bsonType : 'string',
								},
							},
						},
					},
					shippingAddress : {
						bsonType : 'object',
						required : [
							'fullName',
							'line1',
							'city',
							'postalCode',
							'country',
						],
						properties : {
							fullName : {
								bsonType : 'string',
							},
							line1 : {
								bsonType : 'string',
							},
							line2 : {
								bsonType : 'string',
							},
							city : {
								bsonType : 'string',
							},
							postalCode : {
								bsonType : 'string',
							},
							country : {
								bsonType : 'string',
							},
							phone : {
								bsonType : 'string',
							},
						},
					},
					totals : {
						bsonType : 'object',
						required : [
							'subtotalAmount',
							'shippingAmount',
							'totalAmount',
							'currency',
						],
						properties : {
							subtotalAmount : {
								bsonType : 'number',
								minimum : 0,
							},
							shippingAmount : {
								bsonType : 'number',
								minimum : 0,
							},
							totalAmount : {
								bsonType : 'number',
								minimum : 0,
							},
							currency : {
								enum : [ 'PLN', 'EUR', 'USD' ],
							},
						},
					},
					paymentId : {
						bsonType : 'objectId',
					},
					createdAt : {
						bsonType : 'date',
					},
					updatedAt : {
						bsonType : 'date',
					},
					paidAt : {
						bsonType : 'date',
					},
					cancelledAt : {
						bsonType : 'date',
					},
				},
			},
		} );
	}

	private async applyPaymentsValidation(): Promise< void >
	{
		await this.applyCollectionValidator( 'payments', {
			$jsonSchema : {
				bsonType : 'object',
				required : [
					'orderId',
					'userId',
					'provider',
					'status',
					'amount',
					'currency',
					'createdAt',
					'updatedAt',
				],
				properties : {
					orderId : {
						bsonType : 'objectId',
					},
					userId : {
						bsonType : 'objectId',
					},
					provider : {
						enum : [ 'mock' ],
					},
					status : {
						enum : [ 'pending', 'paid', 'failed' ],
					},
					amount : {
						bsonType : 'number',
						minimum : 0,
					},
					currency : {
						enum : [ 'PLN', 'EUR', 'USD' ],
					},
					mockTransactionId : {
						bsonType : 'string',
					},
					failureReason : {
						bsonType : 'string',
					},
					createdAt : {
						bsonType : 'date',
					},
					updatedAt : {
						bsonType : 'date',
					},
					paidAt : {
						bsonType : 'date',
					},
					failedAt : {
						bsonType : 'date',
					},
				},
			},
		} );
	}

	private async applyReviewsValidation(): Promise< void >
	{
		await this.applyCollectionValidator( 'reviews', {
			$jsonSchema : {
				bsonType : 'object',
				required : [
					'productId',
					'userId',
					'orderId',
					'rating',
					'createdAt',
					'updatedAt',
				],
				properties : {
					productId : {
						bsonType : 'objectId',
					},
					userId : {
						bsonType : 'objectId',
					},
					orderId : {
						bsonType : 'objectId',
					},
					rating : {
						bsonType : [ 'int', 'long' ],
						minimum : 1,
						maximum : 5,
					},
					title : {
						bsonType : 'string',
						maxLength : 120,
					},
					comment : {
						bsonType : 'string',
						maxLength : 2000,
					},
					createdAt : {
						bsonType : 'date',
					},
					updatedAt : {
						bsonType : 'date',
					},
					deletedAt : {
						bsonType : 'date',
					},
				},
			},
		} );
	}

	private async applyCategoriesValidation(): Promise< void >
	{
		await this.applyCollectionValidator( 'categories', {
			$jsonSchema : {
				bsonType : 'object',
				required : [
					'name',
					'slug',
					'status',
					'createdAt',
					'updatedAt',
				],
				properties : {
					name : {
						bsonType : 'string',
						minLength : 1,
						maxLength : 100,
					},
					slug : {
						bsonType : 'string',
						minLength : 1,
						maxLength : 120,
						pattern : '^[a-z0-9]+(?:-[a-z0-9]+)*$',
					},
					description : {
						bsonType : 'string',
						maxLength : 1000,
					},
					status : {
						enum : [ 'active', 'archived' ],
					},
					createdAt : {
						bsonType : 'date',
					},
					updatedAt : {
						bsonType : 'date',
					},
					archivedAt : {
						bsonType : 'date',
					},
				},
			},
		} );
	}

	private async applyCollectionValidator(
	    collectionName: string,
	    validator: object,
	    ): Promise< void >
	{
		const db = this.databaseService.getDb();

		try
		{
			await db.command( {
				collMod : collectionName,
				validator,
				validationLevel : 'strict',
				validationAction : 'error',
			} );

			this.logger.log( `Updated validator for collection "${collectionName}"` );
		}
		catch ( error )
		{
			if ( isMongoNamespaceNotFoundError( error ) )
			{
				await db.createCollection( collectionName, {
					validator,
					validationLevel : 'strict',
					validationAction : 'error',
				} );

				this.logger.log( `Created collection "${collectionName}" with validator` );
				return;
			}

			throw error;
		}
	}
}