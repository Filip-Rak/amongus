import {
	PRODUCT_NAME_MAX_LENGTH,
	RATING_MAX,
	RATING_MIN,
	REVIEW_COMMENT_MAX_LENGTH,
	REVIEW_TITLE_MAX_LENGTH,
	TEXT_MIN_LENGTH,
} from '@/common/validation/validation-limits';

import {CollectionValidatorDefinition} from './collection-validator-definition';

export const reviewValidator: CollectionValidatorDefinition = {
	collectionName : 'reviews',
	validator : {
		$jsonSchema : {
			bsonType : 'object',
			required : [
				'productId',
				'userId',
				'orderId',
				'productName',
				'rating',
				'status',
				'createdAt',
				'updatedAt',
			],
			properties : {
				productId : {
					bsonType : 'objectId',
					description : 'productId must be an ObjectId and is required',
				},
				userId : {
					bsonType : 'objectId',
					description : 'userId must be an ObjectId and is required',
				},
				orderId : {
					bsonType : 'objectId',
					description : 'orderId must be an ObjectId and is required',
				},
				productName : {
					bsonType : 'string',
					minLength : TEXT_MIN_LENGTH,
					maxLength : PRODUCT_NAME_MAX_LENGTH,
					description : 'productName must be a non-empty product name snapshot',
				},
				rating : {
					bsonType : 'number',
					minimum : RATING_MIN,
					maximum : RATING_MAX,
					description : 'rating must be between 1 and 5',
				},
				title : {
					bsonType : 'string',
					maxLength : REVIEW_TITLE_MAX_LENGTH,
					description : 'title must be a string when present',
				},
				comment : {
					bsonType : 'string',
					maxLength : REVIEW_COMMENT_MAX_LENGTH,
					description : 'comment must be a string when present',
				},
				status : {
					enum : [ 'active', 'deleted' ],
					description : 'status must be active or deleted',
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
	},
};