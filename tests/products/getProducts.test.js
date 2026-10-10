import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { getProductData, createProductData } from '../helpers/products.js';
import { getProducts, getProductById } from '../../api/products.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('GET /products', () => {

    it('Successfully return list of all products with pagination and limit', async() => {
        const response = await getProducts({page: 2, limit: 5})

        expect(response.status).toBe(200);
        expect(response.body.data.length).toEqual(5);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('name');
    });
    
    it('Successfully filter by Category', async() => {
        const response = await getProducts({category: 'Electronics'})

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(0);
        response.body.data.forEach(product => {
            expect(product.category).toEqual('Electronics');
        })
    });

    it('Successfully search the item', async() => {
        const searchtext = 'shoes';
        const response = await getProducts({search: searchtext});

        expect(response.status).toBe(200);
        response.body.data.forEach(product => {
            const prodname = product.name.toLowerCase();
            expect(prodname).toContain(searchtext);
        });
    });

    it('Successfully sort with order (price ascending)', async() => {
        const response = await getProducts({
            sort: 'price',
            order: 'asc',
            limit: '10'
        });

        const dataLength = response.body.data.length;

        expect(response.status).toBe(200);
        expect(dataLength).toBeGreaterThan(1);

        for(let i = 0; i < dataLength - 1; i++) {
            expect(typeof response.body.data[i].price).toBe('number');
                expect(typeof response.body.data[i + 1].price).toBe('number');
                expect(response.body.data[i + 1].price).toBeGreaterThanOrEqual(response.body.data[i].price);
        };
    });

    it('Successfully sort with order (price descending)', async() => {
        const response = await getProducts({
            sort: 'price',
            order: 'desc',
            limit: '10'
        });

        const dataLength = response.body.data.length;

        expect(response.status).toBe(200);
        expect(dataLength).toBeGreaterThan(1);

        for(let i = 0; i < dataLength - 1; i++) {
            expect(typeof response.body.data[i].price).toBe('number');
                expect(typeof response.body.data[i + 1].price).toBe('number');
                expect(response.body.data[i].price).toBeGreaterThanOrEqual(response.body.data[i + 1].price);
        };
    });

    it('Should shows only product according to price limit', async() => {
        const response = await getProducts({
            minPrice: 40,
            maxPrice: 100,
            limit: 10,
            sort: 'price',
            order: 'asc'
        })

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(1);

        response.body.data.forEach(product => {
            expect(product.price).toBeGreaterThanOrEqual(40);
            expect(product.price).toBeLessThanOrEqual(100);
        });
    });

    it('should show product with price > 80 only', async() => {
        const response = await getProducts({
            minPrice: 80,
            sort: 'price',
            order: 'asc'
        })

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(1);

        response.body.data.forEach(product => {
            expect(product.price).toBeGreaterThan(80);
        });
    });

    it('should show product with price < 80 only', async() => {
        const response = await getProducts({
            maxPrice: 80,
            sort: 'price',
            order: 'asc'
        })

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(1);

        response.body.data.forEach(product => {
            expect(product.price).toBeLessThan(80);
        });
    });

    it('should return empty data array on out-of-range page', async() => {
        const response = await getProducts({
            limit: 30,
            page: 5
        })

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(0);
    });

    it('should return data of specific product by id', async() => {
        const prodId = ((await getProductData(1)).productId);

        const response = await getProductById(prodId);

        expect(response.status).toBe(200);
        expect(response.body.id).toEqual(prodId);
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('category');
        expect(response.body).toHaveProperty('price');
    });

    it('should return error on nonexistent product id', async() => {
        const response = await getProductById('99138491235');

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Product not found.');
    });
});