import {ProductsRepository} from '@/products/products.repository';
import {ProductRecord} from '@/products/types/product-document.type';
import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {CartsRepository} from './carts.repository';
import {AddCartItemDto} from './dto/add-cart-item.dto';
import {CartItemResponseDto, CartResponseDto, CartTotalDto} from './dto/cart-response.dto';
import {UpdateCartItemDto} from './dto/update-cart-item.dto';
import {CartRecord} from './types/cart-document.type';

@Injectable() export class CartsService
{
	constructor(
	    private readonly cartsRepository: CartsRepository,
	    private readonly productsRepository: ProductsRepository,
	)
	{}

	async findMine( userId: ObjectId ): Promise< CartResponseDto >
	{
		const cart = await this.cartsRepository.findByUserId( userId );

		return this.toResponseDto( userId, cart );
	}

	async addItem(
	    userId: ObjectId,
	    dto: AddCartItemDto,
	    ): Promise< CartResponseDto >
	{
		const productId = new ObjectId( dto.productId );

		await this.assertProductCanBeAddedToCart( productId, dto.quantity );

		const cart = await this.cartsRepository.addItem(
		    userId,
		    productId,
		    dto.quantity,
		);

		return this.toResponseDto( userId, cart );
	}

	async updateItem(
	    userId: ObjectId,
	    productId: ObjectId,
	    dto: UpdateCartItemDto,
	    ): Promise< CartResponseDto >
	{
		await this.assertProductCanBeAddedToCart( productId, dto.quantity );

		const cart = await this.cartsRepository.setItemQuantity(
		    userId,
		    productId,
		    dto.quantity,
		);

		return this.toResponseDto( userId, cart );
	}

	async removeItem( userId: ObjectId, productId: ObjectId ): Promise< void >
	{
		await this.cartsRepository.removeItem( userId, productId );
	}

	async clear( userId: ObjectId ): Promise< void >
	{
		await this.cartsRepository.clear( userId );
	}

	private async assertProductCanBeAddedToCart(
	    productId: ObjectId,
	    quantity: number,
	    ): Promise< void >
	{
		const product = await this.productsRepository.findActiveById( productId );

		if ( !product )
		{
			throw new NotFoundException( 'Product not found' );
		}

		if ( product.stock <= 0 )
		{
			throw new ConflictException( 'Product is out of stock' );
		}

		if ( quantity > product.stock )
		{
			throw new ConflictException( 'Requested quantity exceeds available stock' );
		}
	}

	private async toResponseDto(
	    userId: ObjectId,
	    cart: CartRecord|null,
	    ): Promise< CartResponseDto >
	{
		if ( !cart )
		{
			return {
				id : null,
				userId : userId.toHexString(),
				items : [],
				totalQuantity : 0,
				totals : [],
				createdAt : null,
				updatedAt : null,
			};
		}

		const productIds   = cart.items.map( ( item ) => item.productId );
		const products     = await this.productsRepository.findActiveByIds( productIds );
		const productsById = new Map(
		    products.map( ( product ) => [ product._id.toHexString(), product ] ),
		);

		const items = cart.items.map( ( item ): CartItemResponseDto => {
			const product = productsById.get( item.productId.toHexString() );

			if ( !product )
			{
				return {
					productId : item.productId.toHexString(),
					quantity : item.quantity,
					addedAt : item.addedAt.toISOString(),
					updatedAt : item.updatedAt.toISOString(),
					isAvailable : false,
					lineTotalAmount : null,
					product : null,
				};
			}

			const primaryImage = product.images.find( ( image ) => image.isPrimary ) ?? product.images[ 0 ];

			return {
				productId : item.productId.toHexString(),
				quantity : item.quantity,
				addedAt : item.addedAt.toISOString(),
				updatedAt : item.updatedAt.toISOString(),
				isAvailable : true,
				lineTotalAmount : product.price.amount * item.quantity,
				product : {
					id : product._id.toHexString(),
					name : product.name,
					slug : product.slug,
					price : product.price,
					stock : product.stock,
					imageUrl : primaryImage?.url,
				},
			};
		} );

		return {
			id : cart._id.toHexString(),
			userId : cart.userId.toHexString(),
			items,
			totalQuantity : this.calculateTotalQuantity( items ),
			totals : this.calculateTotals( cart, productsById ),
			createdAt : cart.createdAt.toISOString(),
			updatedAt : cart.updatedAt.toISOString(),
		};
	}

	private calculateTotalQuantity( items: CartItemResponseDto[] ): number
	{
		return items.reduce( ( sum, item ) => sum + item.quantity, 0 );
	}

	private calculateTotals(
	    cart: CartRecord,
	    productsById: Map< string, ProductRecord >,
	    ): CartTotalDto[]
	{
		const totalsByCurrency = new Map< string, CartTotalDto >();

		for ( const item of cart.items )
		{
			const product = productsById.get( item.productId.toHexString() );

			if ( !product )
			{
				continue;
			}

			const currency = product.price.currency;
			const existing = totalsByCurrency.get( currency );

			if ( existing )
			{
				existing.amount += product.price.amount * item.quantity;
				continue;
			}

			totalsByCurrency.set( currency, {
				currency,
				amount : product.price.amount * item.quantity,
			} );
		}

		return [...totalsByCurrency.values() ];
	}
}