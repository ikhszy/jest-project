import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { createProductData } from '../helpers/products.js';
import { updateProduct } from '../../api/products.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('PUT /products', () => {
    let prodId, prodName, prodCategory, prodDescription = '';
    let prodPrice, prodStock, prodRating = 0;
    let token = '';
    let custToken = '';

    beforeAll(async() => {
        token = (await getToken('admin', 'Admin1234!')).access_token;
        custToken = (await getToken('alice', 'Password1!')).access_token;

        const prod = await createProductData(token);
        prodId = prod.productId;
        prodName = prod.productName;
        prodCategory = prod.productCategory;
        prodDescription = prod.productdescription;
        prodPrice = prod.productPrice;
        prodStock = prod.productStock;
        prodRating = prod.productRating;
    });

    it('Successfully update by PUT on a product', async() => {
        const response = await updateProduct(token, prodId, {
            name: 'new product name',
            category: 'new category',
            price: 500.00,
            stock: 500,
            rating: 3.3,
            description: 'PUT product data'
        });

        expect(response.status).toBe(200);
        expect(response.body.id).toEqual(prodId);
        expect(response.body.name).toEqual('new product name');
        expect(response.body.category).toEqual('new category');
        expect(response.body.price).toEqual(500.00);
        expect(response.body.stock).toEqual(500);
        expect(response.body.rating).toEqual(3.3);
        expect(response.body.description).toEqual('PUT product data');
    });

    it('Failed on ID not found', async() => {
        const response = await updateProduct(token, 9912481, {
            name: 'new product name',
            category: 'new category',
            price: 500.00,
            stock: 500,
            rating: 3.3,
            description: 'PUT product data'
        });

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Product not found.');
    });

    it('Failed on using customer token', async() => {
        const response = await updateProduct(custToken, prodId, {
            name: 'new product name',
            category: 'new category',
            price: 500.00,
            stock: 500,
            rating: 3.3,
            description: 'PUT product data'
        });

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Admin access required.');
    });
});