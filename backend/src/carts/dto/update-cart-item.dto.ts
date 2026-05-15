import {CART_ITEM_MAX_QUANTITY, CART_ITEM_MIN_QUANTITY} from '@/common/validation/validation-limits';
import {IsInt, Max, Min} from 'class-validator';

export class UpdateCartItemDto
{
	@IsInt() @Min( CART_ITEM_MIN_QUANTITY ) @Max( CART_ITEM_MAX_QUANTITY ) quantity: number;
}