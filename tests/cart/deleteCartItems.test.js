import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { getProductData } from '../helpers/products.js';
import { getCart, createCart, deleteCart, deleteCartItems } from '../../api/cart.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('DELETE /cart/items/:productId', () => {
    let custToken = '';
    let custCart = '';
    let cartTotal, carts;
    let cartItems = [];

    beforeAll(async() => {
        custToken = await(await getToken('alice', 'Password1!')).access_token;

        // clear cart first
        await deleteCart(custToken);

        // fetch all product IDs at the same time
        const products = await Promise.all(
            Array.from({ length: 5}, (_, i) => getProductData(i + 1))
        );

        // add all items to cart in parallel
        const responses = await Promise.all(
            products.map(prod => createCart(custToken, {
                product_id: prod.productId,
                quantity: Math.floor(Math.random() * 10) + 1
            }))
        );

        // save the final cart state once
        const response = await getCart(custToken);
        cartItems = response.body.items;
        cartTotal = response.body.total;
    });

    it('successfully delete item from cart', async() => {
        const cartId = cartItems[0].product_id;
        const cartLength = cartItems.length;

        const response = await deleteCartItems(custToken, cartId);

        // verify status, items length, and cart total
        expect(response.status).toBe(200);
        expect(response.body.items.length).toBeLessThan(cartLength);
        expect(response.body.total).toBeLessThan(cartTotal);

        // verify product_id is removed from cart
        response.body.items.forEach(item => {
            expect(item.product_id).not.toBe(cartId);
        });
    });

    it('Failed on non existing product_id', async() => {
        const response = await deleteCartItems(custToken, 92292992);

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Item not in cart.')
    });

    it('Failed on non existing token', async() => {
        const cartId = cartItems[0].product_id;

        const response = await deleteCartItems('', cartId);

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.')
    });
});