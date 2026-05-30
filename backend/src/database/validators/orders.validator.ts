import {
	ADDRESS_CITY_MAX_LENGTH,
	ADDRESS_COUNTRY_MAX_LENGTH,
	ADDRESS_COUNTRY_MIN_LENGTH,
	ADDRESS_FULL_NAME_MAX_LENGTH,
	ADDRESS_LINE_MAX_LENGTH,
	ADDRESS_PHONE_MAX_LENGTH,
	ADDRESS_POSTAL_CODE_MAX_LENGTH,
	COMPANY_NAME_MAX_LENGTH,
	COMPANY_TAX_ID_MAX_LENGTH,
	TEXT_MIN_LENGTH
} from '@/common/validation/validation-limits';

import {CollectionValidatorDefinition} from './collection-validator-definition';

const NUMERIC_BSON_TYPES = [ 'int', 'long', 'double', 'decimal' ];

const addressSchema = {
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
			description : 'country must be a valid string',
		},
		phone : {
			bsonType : 'string',
			maxLength : ADDRESS_PHONE_MAX_LENGTH,
			description : 'phone must be a string when present',
		},
	},
};

export const orderValidator: CollectionValidatorDefinition = {
	collectionName : 'orders',
	validator : {
		$jsonSchema : {
			bsonType : 'object',
			required : [
				'userId',
				'status',
				'purchaseType',
				'invoice',
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
					description : 'status must be a supported order status',
				},
				purchaseType : {
					enum : [
						'private',
						'company',
					],
					description : 'purchaseType must be private or company',
				},
				invoice : {
					bsonType : 'object',
					required : [
						'requested',
						'billingAddressSameAsShipping',
					],
					description : 'invoice must contain invoice request snapshot data',
					properties : {
						requested : {
							bsonType : 'bool',
							description : 'invoice.requested must be a boolean',
						},
						billingAddressSameAsShipping : {
							bsonType : 'bool',
							description : 'billingAddressSameAsShipping must be a boolean',
						},
						billingAddress : {
							...addressSchema,
							description : 'billingAddress must be an address object when present',
						},
						companyDetails : {
							bsonType : 'object',
							required : [
								'companyName',
								'taxId',
							],
							description : 'companyDetails must contain company invoice data',
							properties : {
								companyName : {
									bsonType : 'string',
									minLength : TEXT_MIN_LENGTH,
									maxLength : COMPANY_NAME_MAX_LENGTH,
									description : 'companyName must be a non-empty string',
								},
								taxId : {
									bsonType : 'string',
									minLength : TEXT_MIN_LENGTH,
									maxLength : COMPANY_TAX_ID_MAX_LENGTH,
									description : 'taxId must be a non-empty string',
								},
							},
						},
					},
				},
				items : {
					bsonType : 'array',
					minItems : 1,
					description : 'items must contain at least one order item',
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
								description : 'productId must be an ObjectId',
							},
							productName : {
								bsonType : 'string',
								description : 'productName must be a string',
							},
							productSlug : {
								bsonType : 'string',
								description : 'productSlug must be a string',
							},
							unitPriceAmount : {
								bsonType : NUMERIC_BSON_TYPES,
								minimum : 0,
								description : 'unitPriceAmount must be a non-negative number',
							},
							currency : {
								enum : [
									'PLN',
									'EUR',
									'USD',
								],
								description : 'currency must be supported',
							},
							quantity : {
								bsonType : NUMERIC_BSON_TYPES,
								minimum : 1,
								description : 'quantity must be positive',
							},
							imageUrl : {
								bsonType : 'string',
								description : 'imageUrl must be a string when present',
							},
						},
					},
				},
				shippingAddress : {
					...addressSchema,
					description : 'shippingAddress must be an address object',
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
							bsonType : NUMERIC_BSON_TYPES,
							minimum : 0,
							description : 'subtotalAmount must be non-negative',
						},
						shippingAmount : {
							bsonType : NUMERIC_BSON_TYPES,
							minimum : 0,
							description : 'shippingAmount must be non-negative',
						},
						totalAmount : {
							bsonType : NUMERIC_BSON_TYPES,
							minimum : 0,
							description : 'totalAmount must be non-negative',
						},
						currency : {
							enum : [
								'PLN',
								'EUR',
								'USD',
							],
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