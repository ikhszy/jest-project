import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { getProductData } from '../helpers/products.js';
import { getCart, createCart, deleteCart } from '../../api/cart.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('POST cart', () => {
    let custToken = '';
    let prodId, qty;

    beforeAll(async() => {
        custToken = await(await getToken('alice', 'Password1!')).access_token;
        prodId = (await (getProductData(1))).productId;
        qty = Math.floor(Math.random() * 10) + 1;

        // clear cart first
        await deleteCart(custToken);
    })

    it('Successfully add single item to cart', async() => {
        const response = await createCart(custToken, {
            product_id: prodId,
            quantity: qty
        });

        expect(response.status).toBe(201);
        expect(response.body.items[0].product_id).toBe(prodId);
        expect(response.body.items[0].quantity).toBe(qty);
    });

    it('add same product again and quantity increased', async() => {
        const response = await createCart(custToken, {
            product_id: prodId,
            quantity: 1
        });

        expect(response.status).toBe(201);
        expect(response.body.items[0].product_id).toBe(prodId);
        expect(response.body.items[0].quantity).toBe(qty + 1);
    });

    it('Return error as no product ID', async() => {
        const response = await createCart(custToken, {
            product_id: '',
            quantity: qty
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('product_id is required.');
    });

    it('Return error as no quantity', async() => {
        const response = await createCart(custToken, {
            product_id: prodId,
            quantity: 0
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('quantity must be a positive integer.');
    });

    it('Return error as product ID not found', async() => {
        const response = await createCart(custToken, {
            product_id: 999120,
            quantity: 5
        });

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Product not found.');
    });

    it('Return error as request sent with invalid token', async() => {
        const response = await createCart('custToken', {
            product_id: 1,
            quantity: 5
        });

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid access token.');
    });
});