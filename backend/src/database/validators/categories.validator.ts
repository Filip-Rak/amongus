import {
	CATEGORY_ATTRIBUTE_ALLOWED_VALUE_MAX_LENGTH,
	CATEGORY_ATTRIBUTE_ALLOWED_VALUES_MAX_COUNT,
	CATEGORY_ATTRIBUTE_KEY_MAX_LENGTH,
	CATEGORY_ATTRIBUTE_KEY_MIN_LENGTH,
	CATEGORY_ATTRIBUTE_LABEL_MAX_LENGTH,
	CATEGORY_ATTRIBUTE_LABEL_MIN_LENGTH,
	CATEGORY_ATTRIBUTE_UNIT_MAX_LENGTH,
	CATEGORY_ATTRIBUTES_MAX_COUNT,
	CATEGORY_DESCRIPTION_MAX_LENGTH,
	CATEGORY_MAX_DEPTH,
	CATEGORY_NAME_MAX_LENGTH,
	CATEGORY_SLUG_MAX_LENGTH,
	TEXT_MIN_LENGTH
} from '@/common/validation/validation-limits';

import {CollectionValidatorDefinition} from './collection-validator-definition';

const NUMERIC_BSON_TYPES = [ 'int', 'long', 'double', 'decimal' ];

export const categoryValidator: CollectionValidatorDefinition = {
	collectionName : 'categories',
	validator : {
		$jsonSchema : {
			bsonType : 'object',
			required : [
				'name',
				'slug',
				'level',
				'status',
				'ancestorIds',
				'attributeDefinitions',
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
				parentId : {
					bsonType : 'objectId',
					description : 'parentId must be an ObjectId when present',
				},
				ancestorIds : {
					bsonType : 'array',
					description : 'ancestorIds must contain ObjectIds of ancestor categories',
					items : {
						bsonType : 'objectId',
					},
				},
				level : {
					bsonType : NUMERIC_BSON_TYPES,
					minimum : 0,
					maximum : CATEGORY_MAX_DEPTH,
					description : 'level must be a non-negative category depth',
				},
				attributeDefinitions : {
					bsonType : 'array',
					maxItems : CATEGORY_ATTRIBUTES_MAX_COUNT,
					description : 'attributeDefinitions must describe category product attributes',
					items : {
						bsonType : 'object',
						required : [
							'key',
							'label',
							'type',
							'isRequired',
						],
						properties : {
							key : {
								bsonType : 'string',
								minLength : CATEGORY_ATTRIBUTE_KEY_MIN_LENGTH,
								maxLength : CATEGORY_ATTRIBUTE_KEY_MAX_LENGTH,
								pattern : '^[a-z][a-z0-9_]*$',
								description : 'attribute key must be a valid identifier',
							},
							label : {
								bsonType : 'string',
								minLength : CATEGORY_ATTRIBUTE_LABEL_MIN_LENGTH,
								maxLength : CATEGORY_ATTRIBUTE_LABEL_MAX_LENGTH,
								description : 'attribute label must be a non-empty string',
							},
							type : {
								enum : [
									'string',
									'number',
									'boolean',
									'string_array',
								],
								description : 'attribute type must be supported',
							},
							isRequired : {
								bsonType : 'bool',
								description : 'isRequired must be a boolean',
							},
							allowedValues : {
								bsonType : 'array',
								maxItems : CATEGORY_ATTRIBUTE_ALLOWED_VALUES_MAX_COUNT,
								description : 'allowedValues must be an array of strings when present',
								items : {
									bsonType : 'string',
									maxLength : CATEGORY_ATTRIBUTE_ALLOWED_VALUE_MAX_LENGTH,
								},
							},
							min : {
								bsonType : NUMERIC_BSON_TYPES,
								description : 'min must be a number when present',
							},
							max : {
								bsonType : NUMERIC_BSON_TYPES,
								description : 'max must be a number when present',
							},
							unit : {
								bsonType : 'string',
								maxLength : CATEGORY_ATTRIBUTE_UNIT_MAX_LENGTH,
								description : 'unit must be a string when present',
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
				archivedAt : {
					bsonType : 'date',
					description : 'archivedAt must be a date when present',
				},
			},
		},
	},
};