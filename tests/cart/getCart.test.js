import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { getProductData } from '../helpers/products.js';
import { getCart } from '../../api/cart.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('GET cart', () => {
    
    let custToken = '';

    beforeAll(async() => {
        custToken = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
    })
    
    it('Successfully shows cart', async() => {
        const response = await getCart(custToken);

        expect(response.status).toBe(200);
        expect(response.body.items.length).toBeGreaterThanOrEqual(1);
        expect(response.body.items[0]).toHaveProperty('cart_item_id');
    });

    it('failed on wrong token', async() => {
        const response = await getCart('wrong token');

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid access token.');
    });

    it('failed on no token', async() => {
        const response = await getCart('');

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });
});