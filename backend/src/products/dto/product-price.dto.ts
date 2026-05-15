import {PRICE_MIN_AMOUNT} from '@/common/validation/validation-limits';
import {Currency} from '@/products/types/currency.enum';
import {IsEnum, IsInt, Min} from 'class-validator';

export class ProductPriceDto
{
	@IsInt() @Min( PRICE_MIN_AMOUNT ) amount: number;
	@IsEnum( Currency ) currency: Currency;
}