import {EMAIL_MAX_LENGTH} from '@/common/validation/validation-limits';

import {CollectionValidatorDefinition} from './collection-validator-definition';

export const userValidator: CollectionValidatorDefinition = {
	collectionName : 'users',
	validator : {
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
					maxLength : EMAIL_MAX_LENGTH,
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
	},
};