import {ObjectId, WithId} from 'mongodb';

import {CategoryAttributeType} from './category-attribute-type.enum';
import {CategoryStatus} from './category-status.enum';

export interface CategoryAttributeDefinition {
	key: string;
	label: string;
	type: CategoryAttributeType;
	required: boolean;
	allowedValues?: string[];
	min?: number;
	max?: number;
	unit?: string;
}

export interface CategoryDocument {
	name: string;
	slug: string;

	parentId?: ObjectId;
	ancestorIds: ObjectId[];
	level: number;

	description?: string;
	status: CategoryStatus;

	attributeDefinitions: CategoryAttributeDefinition[];

	createdAt: Date;
	updatedAt: Date;
	archivedAt?: Date;
}

export type CategoryRecord = WithId< CategoryDocument >;