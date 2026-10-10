import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { createProductData } from '../helpers/products.js';
import { getProductById, deleteProduct } from '../../api/products.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('DELETE /products', () => {
    let prodId = '';
    let token = '';
    let custToken = '';

    beforeAll(async() => {
        token = (await getToken('admin', 'Admin1234!')).access_token;
        custToken = (await getToken('alice', 'Password1!')).access_token;
        
        const prod = await createProductData(token);
        prodId = prod.productId;
    });

    it('Failed on deleting non-existing product', async() => {
        const response = await deleteProduct(token, 99134782);

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Product not found.');        
    });

    it('Failed on using non-admin token', async() => {
        const response = await deleteProduct(custToken, prodId);

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Admin access required.');       
    });

    it('Successfully delete a product', async() => {
        const response = await deleteProduct(token, prodId);

        expect(response.status).toBe(200);
        expect(response.body.message).toEqual('Product deleted.')

        const responseGet = await getProductById(prodId);

        expect(responseGet.status).toBe(404);
        expect(responseGet.body.error).toEqual('Product not found.');        
    });
});