import {
	ADDRESS_CITY_MAX_LENGTH,
	ADDRESS_COUNTRY_MAX_LENGTH,
	ADDRESS_COUNTRY_MIN_LENGTH,
	ADDRESS_FULL_NAME_MAX_LENGTH,
	ADDRESS_LINE_MAX_LENGTH,
	ADDRESS_PHONE_MAX_LENGTH,
	ADDRESS_POSTAL_CODE_MAX_LENGTH,
	CART_ITEM_MIN_QUANTITY,
	PRICE_MIN_AMOUNT,
	PRODUCT_NAME_MAX_LENGTH,
	PRODUCT_SLUG_MAX_LENGTH,
	TEXT_MIN_LENGTH,
} from '@/common/validation/validation-limits';

import {CollectionValidatorDefinition} from './collection-validator-definition';

export const orderValidator: CollectionValidatorDefinition = {
	collectionName : 'orders',
	validator : {
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
					description : 'userId must be an ObjectId and is required',
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
					description : 'status must be a valid order status',
				},
				items : {
					bsonType : 'array',
					minItems : 1,
					description : 'items must contain at least one order item snapshot',
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
								description : 'productId must be an ObjectId and is required',
							},
							productName : {
								bsonType : 'string',
								minLength : TEXT_MIN_LENGTH,
								maxLength : PRODUCT_NAME_MAX_LENGTH,
								description : 'productName must be a non-empty string',
							},
							productSlug : {
								bsonType : 'string',
								minLength : TEXT_MIN_LENGTH,
								maxLength : PRODUCT_SLUG_MAX_LENGTH,
								description : 'productSlug must be a non-empty string',
							},
							unitPriceAmount : {
								bsonType : 'number',
								minimum : PRICE_MIN_AMOUNT,
								description :
								    'unitPriceAmount must be a non-negative numeric amount in minor currency units',
							},
							currency : {
								enum : [ 'PLN', 'EUR', 'USD' ],
								description : 'currency must be supported',
							},
							quantity : {
								bsonType : 'number',
								minimum : CART_ITEM_MIN_QUANTITY,
								description : 'quantity must be a positive number',
							},
							imageUrl : {
								bsonType : 'string',
								description : 'imageUrl must be a string when present',
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
					description : 'shippingAddress must contain required delivery data',
					properties : {
						fullName : {
							bsonType : 'string',
							minLength : TEXT_MIN_LENGTH,
							maxLength : ADDRESS_FULL_NAME_MAX_LENGTH,
							description : 'fullName must be a non-empty string',
						},
						line1 : {
							bsonType : 'string',
							minLength : TEXT_MIN_LENGTH,
							maxLength : ADDRESS_LINE_MAX_LENGTH,
							description : 'line1 must be a non-empty string',
						},
						line2 : {
							bsonType : 'string',
							maxLength : ADDRESS_LINE_MAX_LENGTH,
							description : 'line2 must be a string when present',
						},
						city : {
							bsonType : 'string',
							minLength : TEXT_MIN_LENGTH,
							maxLength : ADDRESS_CITY_MAX_LENGTH,
							description : 'city must be a non-empty string',
						},
						postalCode : {
							bsonType : 'string',
							minLength : TEXT_MIN_LENGTH,
							maxLength : ADDRESS_POSTAL_CODE_MAX_LENGTH,
							description : 'postalCode must be a non-empty string',
						},
						country : {
							bsonType : 'string',
							minLength : ADDRESS_COUNTRY_MIN_LENGTH,
							maxLength : ADDRESS_COUNTRY_MAX_LENGTH,
							description : 'country must be a valid non-empty string',
						},
						phone : {
							bsonType : 'string',
							maxLength : ADDRESS_PHONE_MAX_LENGTH,
							description : 'phone must be a string when present',
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
					description : 'totals must contain order monetary summary',
					properties : {
						subtotalAmount : {
							bsonType : 'number',
							minimum : PRICE_MIN_AMOUNT,
							description : 'subtotalAmount must be non-negative',
						},
						shippingAmount : {
							bsonType : 'number',
							minimum : PRICE_MIN_AMOUNT,
							description : 'shippingAmount must be non-negative',
						},
						totalAmount : {
							bsonType : 'number',
							minimum : PRICE_MIN_AMOUNT,
							description : 'totalAmount must be non-negative',
						},
						currency : {
							enum : [ 'PLN', 'EUR', 'USD' ],
							description : 'currency must be supported',
						},
					},
				},
				paymentId : {
					bsonType : 'objectId',
					description : 'paymentId must be an ObjectId when present',
				},
				createdAt : {
					bsonType : 'date',
					description : 'createdAt must be a date and is required',
				},
				updatedAt : {
					bsonType : 'date',
					description : 'updatedAt must be a date and is required',
				},
				paidAt : {
					bsonType : 'date',
					description : 'paidAt must be a date when present',
				},
				cancelledAt : {
					bsonType : 'date',
					description : 'cancelledAt must be a date when present',
				},
			},
		},
	},
};