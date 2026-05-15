import {
	CART_ITEM_MAX_QUANTITY,
	CART_ITEM_MIN_QUANTITY,
} from '@/common/validation/validation-limits';

import {CollectionValidatorDefinition} from './collection-validator-definition';

export const cartValidator: CollectionValidatorDefinition = {
	collectionName : 'carts',
	validator : {
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
					maxItems : CART_ITEM_MAX_QUANTITY,
					description : 'items must be an array of cart items',
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
								minimum : CART_ITEM_MIN_QUANTITY,
								description : 'quantity must be a positive number',
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
	},
};