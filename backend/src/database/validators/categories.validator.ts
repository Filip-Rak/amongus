import {
	CATEGORY_DESCRIPTION_MAX_LENGTH,
	CATEGORY_NAME_MAX_LENGTH,
	CATEGORY_SLUG_MAX_LENGTH,
	TEXT_MIN_LENGTH
} from '@/common/validation/validation-limits';

import {CollectionValidatorDefinition} from './collection-validator-definition';

export const categoryValidator: CollectionValidatorDefinition = {
	collectionName : 'categories',
	validator : {
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
					minLength : TEXT_MIN_LENGTH,
					maxLength : CATEGORY_NAME_MAX_LENGTH,
					description : 'name must be a non-empty string',
				},
				slug : {
					bsonType : 'string',
					minLength : TEXT_MIN_LENGTH,
					maxLength : CATEGORY_SLUG_MAX_LENGTH,
					pattern : '^[a-z0-9]+(?:-[a-z0-9]+)*$',
					description : 'slug must be a valid URL slug',
				},
				description : {
					bsonType : 'string',
					maxLength : CATEGORY_DESCRIPTION_MAX_LENGTH,
					description : 'description must be a string when present',
				},
				status : {
					enum : [ 'active', 'archived' ],
					description : 'status must be active or archived',
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