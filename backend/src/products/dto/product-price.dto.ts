import {PRICE_MIN_AMOUNT} from '@/common/validation/validation-limits';
import {IsEnum, IsInt, Min} from 'class-validator';

import {Currency} from '../types/currency.enum';

export class ProductPriceDto
{
	@IsInt() @Min( PRICE_MIN_AMOUNT ) amount: number;
	@IsEnum( Currency ) currency: Currency;
}