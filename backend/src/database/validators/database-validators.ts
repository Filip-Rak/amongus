import {cartValidator} from './carts.validator';
import {categoryValidator} from './categories.validator';
import type {CollectionValidatorDefinition} from './collection-validator-definition';
import {orderValidator} from './orders.validator';
import {paymentValidator} from './payments.validator';
import {productValidator} from './products.validator';
import {reviewValidator} from './reviews.validator';
import {userValidator} from './users.validator';

export const databaseValidators = [
	userValidator,
	productValidator,
	cartValidator,
	orderValidator,
	paymentValidator,
	reviewValidator,
	categoryValidator,
] satisfies CollectionValidatorDefinition[];