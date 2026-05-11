import {CartsRepository} from '@/carts/carts.repository';
import {DatabaseService} from '@/database/database.service';
import {PaymentsRepository} from '@/payments/payments.repository';
import {PaymentRecord} from '@/payments/types/payment-document.type';
import {ProductsRepository} from '@/products/products.repository';
import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CheckoutDto} from './dto/checkout.dto';
import {
	CheckoutResponseDto,
	OrderItemResponseDto,
	OrderResponseDto,
} from './dto/order-response.dto';
import {OrdersRepository} from './orders.repository';
import {OrderAddressSnapshot, OrderItemSnapshot, OrderRecord} from './types/order-document.type';

@Injectable() export class OrdersService
{
	private static readonly SHIPPING_AMOUNT = 0;

	constructor(
	    private readonly databaseService: DatabaseService,
	    private readonly cartsRepository: CartsRepository,
	    private readonly productsRepository: ProductsRepository,
	    private readonly ordersRepository: OrdersRepository,
	    private readonly paymentsRepository: PaymentsRepository,
	)
	{}

	async checkout(
	    userId: ObjectId,
	    dto: CheckoutDto,
	    ): Promise< CheckoutResponseDto >
	{
		return this.databaseService.withTransaction( async ( session ) => {
			const cart = await this.cartsRepository.findByUserId( userId, {
				session,
			} );

			if ( !cart || cart.items.length === 0 )
			{
				throw new BadRequestException( 'Cart is empty' );
			}

			const productIds = this.uniqueObjectIds(
			    cart.items.map( ( item ) => item.productId ),
			);

			const products = await this.productsRepository.findActiveByIds(
			    productIds,
			    {
				    session,
			    },
			);

			const productsById = new Map(
			    products.map( ( product ) => [ product._id.toHexString(), product ] ),
			);

			const orderItems = cart.items.map( ( item ): OrderItemSnapshot => {
				const product = productsById.get( item.productId.toHexString() );

				if ( !product )
				{
					throw new ConflictException(
					    'Cart contains a product that is no longer available',
					);
				}

				if ( item.quantity > product.stock )
				{
					throw new ConflictException(
					    `Insufficient stock for product "${product.name}"`,
					);
				}

				const primaryImage = product.images.find( ( image ) => image.isPrimary ) ?? product.images[ 0 ];

				const snapshot: OrderItemSnapshot = {
					productId : product._id,
					productName : product.name,
					productSlug : product.slug,
					unitPriceAmount : product.price.amount,
					currency : product.price.currency,
					quantity : item.quantity,
				};

				if ( primaryImage?.url )
				{
					snapshot.imageUrl = primaryImage.url;
				}

				return snapshot;
			} );

			const currency = orderItems[ 0 ]?.currency;

			if ( !currency )
			{
				throw new BadRequestException( 'Cart is empty' );
			}

			const hasMixedCurrencies = orderItems.some(
			    ( item ) => item.currency !== currency,
			);

			if ( hasMixedCurrencies )
			{
				throw new BadRequestException(
				    'Checkout with multiple currencies is not supported',
				);
			}

			for ( const item of cart.items )
			{
				const stockDecreased = await this.productsRepository.decreaseStockIfAvailable(
				    item.productId,
				    item.quantity,
				    {
					    session,
				    },
				);

				if ( !stockDecreased )
				{
					throw new ConflictException(
					    'Product stock changed before checkout could complete',
					);
				}
			}

			const subtotalAmount = orderItems.reduce(
			    ( sum, item ) => sum + item.unitPriceAmount * item.quantity,
			    0,
			);

			const order = await this.ordersRepository.create(
			    {
				    userId,
				    items : orderItems,
				    shippingAddress : this.buildShippingAddressSnapshot( dto ),
				    totals : {
					    subtotalAmount,
					    shippingAmount : OrdersService.SHIPPING_AMOUNT,
					    totalAmount : subtotalAmount + OrdersService.SHIPPING_AMOUNT,
					    currency,
				    },
			    },
			    {
				    session,
			    },
			);

			const payment = await this.paymentsRepository.createPendingMock(
			    {
				    orderId : order._id,
				    userId,
				    amount : order.totals.totalAmount,
				    currency : order.totals.currency,
			    },
			    {
				    session,
			    },
			);

			const orderWithPayment = await this.ordersRepository.attachPayment(
			    order._id,
			    payment._id,
			    {
				    session,
			    },
			);

			if ( !orderWithPayment )
			{
				throw new NotFoundException( 'Order not found' );
			}

			await this.cartsRepository.clear( userId, {
				session,
			} );

			return {
				order : this.toResponseDto( orderWithPayment ),
				payment : this.toPaymentResponseDto( payment ),
			};
		} );
	}

	async findMine( userId: ObjectId ): Promise< OrderResponseDto[] >
	{
		const orders = await this.ordersRepository.findByUserId( userId );

		return orders.map( ( order ) => this.toResponseDto( order ) );
	}

	async findOneMine(
	    userId: ObjectId,
	    orderId: ObjectId,
	    ): Promise< OrderResponseDto >
	{
		const order = await this.ordersRepository.findByIdForUser( orderId, userId );

		if ( !order )
		{
			throw new NotFoundException( 'Order not found' );
		}

		return this.toResponseDto( order );
	}

	private uniqueObjectIds( ids: ObjectId[] ): ObjectId[]
	{
		const uniqueIds = new Map< string, ObjectId >();

		for ( const id of ids )
		{
			uniqueIds.set( id.toHexString(), id );
		}

		return [...uniqueIds.values() ];
	}

	private toResponseDto( order: OrderRecord ): OrderResponseDto
	{
		return {
			id : order._id.toHexString(),
			userId : order.userId.toHexString(),
			status : order.status,
			items : order.items.map( ( item ): OrderItemResponseDto => ( {
				                         productId : item.productId.toHexString(),
				                         productName : item.productName,
				                         productSlug : item.productSlug,
				                         unitPriceAmount : item.unitPriceAmount,
				                         currency : item.currency,
				                         quantity : item.quantity,
				                         imageUrl : item.imageUrl,
			                         } ) ),
			shippingAddress : order.shippingAddress,
			totals : order.totals,
			paymentId : order.paymentId?.toHexString(),
			createdAt : order.createdAt.toISOString(),
			updatedAt : order.updatedAt.toISOString(),
			paidAt : order.paidAt?.toISOString(),
			cancelledAt : order.cancelledAt?.toISOString(),
		};
	}

	private toPaymentResponseDto( payment: PaymentRecord )
	{
		return {
			id : payment._id.toHexString(),
			orderId : payment.orderId.toHexString(),
			userId : payment.userId.toHexString(),
			provider : payment.provider,
			status : payment.status,
			amount : payment.amount,
			currency : payment.currency,
			mockTransactionId : payment.mockTransactionId,
			failureReason : payment.failureReason,
			createdAt : payment.createdAt.toISOString(),
			updatedAt : payment.updatedAt.toISOString(),
			paidAt : payment.paidAt?.toISOString(),
			failedAt : payment.failedAt?.toISOString(),
		};
	}

	private buildShippingAddressSnapshot(
	    dto: CheckoutDto,
	    ): OrderAddressSnapshot
	{
		const address: OrderAddressSnapshot = {
			fullName : dto.shippingAddress.fullName,
			line1 : dto.shippingAddress.line1,
			city : dto.shippingAddress.city,
			postalCode : dto.shippingAddress.postalCode,
			country : dto.shippingAddress.country,
		};

		if ( dto.shippingAddress.line2 )
		{
			address.line2 = dto.shippingAddress.line2;
		}

		if ( dto.shippingAddress.phone )
		{
			address.phone = dto.shippingAddress.phone;
		}

		return address;
	}
}