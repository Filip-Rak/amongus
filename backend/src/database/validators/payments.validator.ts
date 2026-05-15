import {
	PAYMENT_FAILURE_REASON_MAX_LENGTH,
	PRICE_MIN_AMOUNT,
} from '@/common/validation/validation-limits';

import {CollectionValidatorDefinition} from './collection-validator-definition';

export const paymentValidator: CollectionValidatorDefinition = {
	collectionName : 'payments',
	validator : {
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
					description : 'orderId must be an ObjectId and is required',
				},
				userId : {
					bsonType : 'objectId',
					description : 'userId must be an ObjectId and is required',
				},
				provider : {
					enum : [ 'mock' ],
					description : 'provider must be mock',
				},
				status : {
					enum : [ 'pending', 'paid', 'failed' ],
					description : 'status must be pending, paid, or failed',
				},
				amount : {
					bsonType : 'number',
					minimum : PRICE_MIN_AMOUNT,
					description : 'amount must be a non-negative numeric amount in minor currency units',
				},
				currency : {
					enum : [ 'PLN', 'EUR', 'USD' ],
					description : 'currency must be supported',
				},
				mockTransactionId : {
					bsonType : 'string',
					description : 'mockTransactionId must be a string when present',
				},
				failureReason : {
					bsonType : 'string',
					maxLength : PAYMENT_FAILURE_REASON_MAX_LENGTH,
					description : 'failureReason must be a string when present',
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
				failedAt : {
					bsonType : 'date',
					description : 'failedAt must be a date when present',
				},
			},
		},
	},
};