import {ObjectId, WithId} from 'mongodb';

import {ReviewStatus} from './review-status.enum';

export interface ReviewDocument {
	productId: ObjectId;
	userId: ObjectId;

	productName: string;

	rating: number;
	title?: string;
	comment?: string;

	status: ReviewStatus;

	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export type ReviewRecord = WithId< ReviewDocument >;