import {WithId} from 'mongodb';

import {CategoryStatus} from './category-status.enum';

export interface CategoryDocument {
	name: string;
	slug: string;
	description?: string;

	status: CategoryStatus;

	createdAt: Date;
	updatedAt: Date;
	archivedAt?: Date;
}

export type CategoryRecord = WithId< CategoryDocument >;