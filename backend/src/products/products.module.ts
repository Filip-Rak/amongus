import {CategoriesModule} from '@/categories/categories.module';
import {Module} from '@nestjs/common';

import {ProductsController} from './products.controller';
import {ProductsRepository} from './products.repository';
import {ProductsService} from './products.service';

@Module( {
	imports : [ CategoriesModule, CategoriesModule ],
	controllers : [ ProductsController ],
	providers : [
		ProductsService,
		ProductsRepository,
	],
	exports : [
		ProductsService,
		ProductsRepository,
	],
} )
export class ProductsModule
{}