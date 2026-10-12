import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { createProductData } from '../helpers/products.js';
import { patchProduct } from '../../api/products.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('PATCH /products', () => {

    let prodId, prodName, prodCategory, prodDescription = '';
    let prodPrice, prodStock, prodRating = 0;
    let token = '';
    let custToken = '';

    beforeAll(async() => {
        token = await(await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)).access_token;
        custToken = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;

        const prod = await createProductData(token);
        prodId = prod.productId;
        prodName = prod.productName;
        prodCategory = prod.productCategory;
        prodDescription = prod.productdescription;
        prodPrice = prod.productPrice;
        prodStock = prod.productStock;
        prodRating = prod.productRating;
    });

    it('Successfully patch existing product', async() => {
        const response = await patchProduct(token, prodId, {
            name: 'new product name',
            price: 100.00,
            description: 'Patching product'
        });

        expect(response.status).toBe(200);
        expect(response.body.id).toEqual(prodId);
        expect(response.body.name).toEqual('new product name');
        expect(response.body.price).toEqual(100.00);
        expect(response.body.description).toEqual('Patching product');
    });

    it('Return failed with no body to update', async() => {
        const response = await patchProduct(token, prodId, {
            
        });
        
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('No updatable fields provided.');
    });

    it('Failed as ID not found', async() => {
        const response = await patchProduct(token, 99821, {
            name: 'new product name',
            price: 100.00,
            description: 'Patching product'
        });

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Product not found.');
    });

    it('Failed as it used customer token', async() => {
        const response = await patchProduct(custToken, prodId, {
            name: 'new product name',
            price: 100.00,
            description: 'Patching product'
        });

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Admin access required.');
    });
});