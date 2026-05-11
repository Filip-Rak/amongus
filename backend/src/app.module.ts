import {Module} from '@nestjs/common';

import {AuthModule} from './auth/auth.module';
import {CartsModule} from './carts/carts.module';
import {DatabaseModule} from './database/database.module';
import {DatabaseService} from './database/database.service';
import {HealthModule} from './health/health.module';
import {OrdersModule} from './orders/orders.module';
import {PaymentsModule} from './payments/payments.module';
import {ProductsController} from './products/products.controller';
import {ProductsModule} from './products/products.module';
import {ProductsService} from './products/products.service';
import {UsersController} from './users/users.controller';
import {UsersModule} from './users/users.module';

@Module( {
	imports : [
		DatabaseModule,
		HealthModule,
		UsersModule,
		AuthModule,
		ProductsModule,
		CartsModule,
		OrdersModule,
		PaymentsModule,
	],
	controllers : [
		UsersController,
		ProductsController,
	],
	providers : [
		DatabaseService,
		ProductsService,
	],
} )
export class AppModule
{}
