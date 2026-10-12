import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { getProductData, createProductData } from '../helpers/products.js';
import { getProducts, getProductById, createProduct, patchProduct, updateProduct, deleteProduct } from '../../api/products.js';

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
            limit: 100,
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

describe('POST /products', () => {
    it('should successfully create new product as admin', async() => {
        const { access_token: token } = await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
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
        const { access_token: token } = await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
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
        const { access_token: token } = await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
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
        const { access_token: token } = await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
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
        const { access_token: token } = await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD);
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
        const { access_token: token } = await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
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

describe('PUT /products', () => {
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

describe('DELETE /products', () => {
    let prodId = '';
    let token = '';
    let custToken = '';

    beforeAll(async() => {
        token = await(await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)).access_token;
        custToken = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
        
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
})