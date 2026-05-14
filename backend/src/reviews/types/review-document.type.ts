import {ObjectId, WithId} from 'mongodb';

export interface ReviewDocument {
	productId: ObjectId;
	userId: ObjectId;
	orderId: ObjectId;

	rating: number;
	title?: string;
	comment?: string;

	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export type ReviewRecord = WithId< ReviewDocument >;