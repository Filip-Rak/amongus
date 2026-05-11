import {ObjectId, WithId} from 'mongodb';

export interface CartItem {
	productId: ObjectId;
	quantity: number;
	addedAt: Date;
	updatedAt: Date;
}

export interface CartDocument {
	userId: ObjectId;
	items: CartItem[];
	createdAt: Date;
	updatedAt: Date;
}

export type CartRecord = WithId< CartDocument >;