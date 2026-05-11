import {IsEnum, IsInt, Min} from 'class-validator';

import {Currency} from '../types/currency.enum';

export class ProductPriceDto
{
	@IsInt() @Min( 0 ) amount: number;
	@IsEnum( Currency ) currency: Currency;
}