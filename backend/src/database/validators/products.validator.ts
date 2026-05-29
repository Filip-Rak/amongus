import {
	PRICE_MIN_AMOUNT,
	PRODUCT_DESCRIPTION_MAX_LENGTH,
	PRODUCT_IMAGE_ALT_MAX_LENGTH,
	PRODUCT_IMAGES_MAX_COUNT,
	PRODUCT_NAME_MAX_LENGTH,
	PRODUCT_SLUG_MAX_LENGTH,
	RATING_MAX,
	RATING_MIN,
	STOCK_MIN,
	TEXT_MIN_LENGTH,
} from '@/common/validation/validation-limits';

import {CollectionValidatorDefinition} from './collection-validator-definition';

export const productValidator: CollectionValidatorDefinition = {
	collectionName : 'products',
	validator : {
		$jsonSchema : {
			bsonType : 'object',
			required : [
				'name',
				'slug',
				'description',
				'price',
				'stock',
				'categoryId',
				'images',
				'attributeValues',
				'status',
				'averageRating',
				'reviewCount',
				'createdAt',
				'updatedAt',
			],
			properties : {
				name : {
					bsonType : 'string',
					minLength : TEXT_MIN_LENGTH,
					maxLength : PRODUCT_NAME_MAX_LENGTH,
					description : 'name must be a non-empty string',
				},
				slug : {
					bsonType : 'string',
					minLength : TEXT_MIN_LENGTH,
					maxLength : PRODUCT_SLUG_MAX_LENGTH,
					pattern : '^[a-z0-9]+(?:-[a-z0-9]+)*$',
					description : 'slug must be a valid URL slug',
				},
				description : {
					bsonType : 'string',
					minLength : TEXT_MIN_LENGTH,
					maxLength : PRODUCT_DESCRIPTION_MAX_LENGTH,
					description : 'description must be a non-empty string',
				},
				price : {
					bsonType : 'object',
					required : [ 'amount', 'currency' ],
					description : 'price must contain amount and currency',
					properties : {
						amount : {
							bsonType : 'number',
							minimum : PRICE_MIN_AMOUNT,
							description : 'price.amount must be a non-negative numeric amount in minor currency units',
						},
						currency : {
							enum : [ 'PLN', 'EUR', 'USD' ],
							description : 'price.currency must be supported',
						},
					},
				},
				stock : {
					bsonType : 'number',
					minimum : STOCK_MIN,
					description : 'stock must be a non-negative number',
				},
				images : {
					bsonType : 'array',
					maxItems : PRODUCT_IMAGES_MAX_COUNT,
					description : 'images must be an array of product image metadata',
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
								maxLength : PRODUCT_IMAGE_ALT_MAX_LENGTH,
								description : 'image alt must be a string when present',
							},
							isPrimary : {
								bsonType : 'bool',
								description : 'isPrimary must be a boolean',
							},
						},
					},
				},
				categoryId : {
					bsonType : 'objectId',
					description : 'categoryId must be an ObjectId and is required',
				},
				attributeValues : {
					bsonType : 'object',
					description : 'attributeValues must be an object',
				},
				status : {
					enum : [ 'draft', 'active', 'archived' ],
					description : 'status must be draft, active, or archived',
				},
				averageRating : {
					bsonType : [ 'double', 'int', 'long', 'decimal' ],
					minimum : RATING_MIN - 1,
					maximum : RATING_MAX,
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
	},
};