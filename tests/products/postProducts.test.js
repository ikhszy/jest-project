import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { createProduct } from '../../api/products.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('POST /products', () => {
    it('should successfully create new product as admin', async() => {
        const { access_token: token } = await getToken('admin', 'Admin1234!');
        const prodname = `item ${Date.now()}`
        const response = await createProduct(token, {
            name: prodname,
            category: "Electronics",
            price: 49.99,
            stock: 120,
            rating: 4.6,
            description: "test create new product"
        });

        expect(response.status).toBe(201);
        expect(response.body.name).toEqual(prodname);
    });

    it('should failed on missing name', async() => {
        const { access_token: token } = await getToken('admin', 'Admin1234!');
        const prodname = `item ${Date.now()}`
        const response = await createProduct(token, {
            name: '',
            category: "Electronics",
            price: 49.99,
            stock: 120,
            rating: 4.6,
            description: "test create new product"
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('name, category, and price are required.');
    });

    it('should failed on missing category', async() => {
        const { access_token: token } = await getToken('admin', 'Admin1234!');
        const prodname = `item ${Date.now()}`
        const response = await createProduct(token, {
            name: prodname,
            category: "",
            price: 49.99,
            stock: 120,
            rating: 4.6,
            description: "test create new product"
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('name, category, and price are required.');
    });

    it.skip('should failed on missing price', async() => {
        const { access_token: token } = await getToken('admin', 'Admin1234!');
        const prodname = `item ${Date.now()}`
        const response = await createProduct(token, {
            name: prodname,
            category: "Electronics",
            price: 0,
            stock: 120,
            rating: 4.6,
            description: "test create new product"
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('name, category, and price are required.');
    });

    it('should failed on invalid token', async() => {
        const { access_token: token } = await getToken('alice', 'Password1!');
        const prodname = `item ${Date.now()}`
        const response = await createProduct(token, {
            name: prodname,
            category: "Electronics",
            price: 49.99,
            stock: 120,
            rating: 4.6,
            description: "test create new product"
        });

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Admin access required.')
    });

    it('should failed on no token', async() => {
        const { access_token: token } = await getToken('alice', 'Password1!');
        const prodname = `item ${Date.now()}`
        const response = await createProduct('', {
            name: prodname,
            category: "Electronics",
            price: 49.99,
            stock: 120,
            rating: 4.6,
            description: "test create new product"
        });

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.')
    });
});