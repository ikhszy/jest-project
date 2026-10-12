import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { faker } from "@faker-js/faker";
import { getToken } from '../helpers/auth.js';
import { getProductData, getProductById, createProductInsufficientStock, patchProductById, replenishStock } from '../helpers/products.js';
import { createCartData, clearCartData, getCartData, createCartForOrder } from '../helpers/cart.js';
import { getOrder, getOrderById, getOrderWithParam, createOrder, createOrderWithBody, patchOrderStatus, deleteOrderById, clearAllOrders } from '../../api/order.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('POST /orders', () => {

    let custToken_1, custToken_2, adminToken = '';
    let cartData_1 = [];
    let productId, orderQty, previousQty, createdOrderId;

    beforeEach(async () => {
        // clear all orders
        await clearAllOrders();

        // get token for all users
        custToken_1 = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
        custToken_2 = await(await getToken(process.env.CUSTOMER_2_USERNAME, process.env.CUSTOMER_2_PASSWORD)).access_token;
        adminToken = await(await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)).access_token;

        // clear customer carts
        await clearCartData(custToken_1);
        await clearCartData(custToken_2);

        // create product for insufficient stock case
        productId = (await createProductInsufficientStock(adminToken)).productId;

        // fill up stock just in case it drop to 0
        await replenishStock(adminToken, 1);
        await replenishStock(adminToken, 2);

        // get stock before purchase
        previousQty = await (await getProductById(1)).body.stock;

        // fill the cart
        const cartSetup = await createCartForOrder(custToken_1, 1, 5);
    });

    it('successfully create Order', async() => {
        const response_1 = await createOrder(custToken_1);

        createdOrderId = response_1.body.id;

        // validate order success
        expect(response_1.status).toBe(201);
        expect(response_1.body).toHaveProperty('status');   

        // validate product stocks decreased
        const newQty = await (await getProductById(1)).body.stock;
        expect(previousQty).toBeGreaterThan(newQty);

        // validate customer cart is cleared
        const response_2 = await getCartData(custToken_1);
        expect(response_2.status).toBe(200);
        expect(response_2.body.items.length).toBe(0);
    });

    it('Failed with empty street value', async() => {
        const response = await createOrderWithBody(custToken_1, {
            street: '',
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            zip: faker.location.zipCode()
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Shipping address (street, city, state, zip) is required.');
    });

    it('Failed with empty city value', async() => {
        const response = await createOrderWithBody(custToken_1, {
            street: faker.location.streetAddress(),
            city: '',
            state: faker.location.state({ abbreviated: true }),
            zip: faker.location.zipCode()
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Shipping address (street, city, state, zip) is required.');
    });

    it('Failed with empty state value', async() => {
        const response = await createOrderWithBody(custToken_1, {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: '',
            zip: faker.location.zipCode()
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Shipping address (street, city, state, zip) is required.');
    });

    it('Failed with empty zip value', async() => {
        const response = await createOrderWithBody(custToken_1, {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state({ abbreviated: true }),
            zip: ''
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Shipping address (street, city, state, zip) is required.');
    });

    it('Failed as no item in cart', async() => {
        const response = await createOrder(custToken_2);

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Cart is empty.');
    });

    it('Failed as item have insufficient stock', async() => {
        // create cart with empty stock item
        const response_1 = await createCartForOrder(custToken_2, productId, 5);

        // decrease stock manually
        await patchProductById(adminToken, productId, { stock: 0 });

        // checkout the cart
        const response_2 = await createOrder(custToken_2);

        expect(response_2.status).toBe(409);
        expect(response_2.body.error).toContain('Insufficient stock');
    });
    
    afterEach(async() => {
        if (!createdOrderId) return;

        const adminToken = await(await getToken('admin', 'Admin1234!')).access_token;

        // get current orderId from the user
        const custOrderId = (await getOrder(custToken_1)).body.data[0].id;

        // delete the order as admin
        const deleteOrder = await deleteOrderById(adminToken, custOrderId);
        expect(deleteOrder.status).toBe(200);

        createdOrderId = null;
    });
});

describe('GET /orders', () => {

    let custToken_1, custToken_2, adminToken = '';
    let cartData_1 = [];
    let productId, orderQty, previousQty, createdOrderId_1, createdOrderId_2;

    beforeEach(async() => {
        // clear all orders
        await clearAllOrders();

        // get token for all users
        custToken_1 = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
        custToken_2 = await(await getToken(process.env.CUSTOMER_2_USERNAME, process.env.CUSTOMER_2_PASSWORD)).access_token;
        adminToken = await(await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)).access_token;

        // clear customer carts
        await clearCartData(custToken_1);
        await clearCartData(custToken_2);

        // create product for insufficient stock case
        productId = (await createProductInsufficientStock(adminToken)).productId;

        // get stock before purchase
        previousQty = await (await getProductById(1)).body.stock;

        // fill up stock just in case it drop to 0
        await replenishStock(adminToken, 1);
        await replenishStock(adminToken, 2);

        // fill the cart
        const cartSetup1 = await createCartForOrder(custToken_1, 1, 5);
        const cartSetup2 = await createCartForOrder(custToken_2, 2, 5);

        const orderSetup1 = await createOrder(custToken_1);
        const orderSetup2 = await createOrder(custToken_2);

        createdOrderId_1 = orderSetup1.body.id;
        createdOrderId_2 = orderSetup2.body.id;
    });

    it('Success as user trying to view their own order', async() => {
        const response = await getOrder(custToken_1);

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('status');
    });

    it('Success as admin can view all orders', async() => {
        const response = await getOrder(adminToken);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(1);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('status');
    });

    it('Success as admin can filter by status', async() => {
        const response = await getOrderWithParam(adminToken, {
            status: 'pending'
        });

        expect(response.status).toBe(200);

        response.body.data.forEach(res => {
            expect(res.status).toEqual('pending');
        });
    });

    it('Success with pagination and limit', async() => {
        const response = await getOrderWithParam(adminToken, {
            limit: 1,
            page: 2
        });

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0]).toHaveProperty('status');
    });

    it('Failed on missing token (all orders)', async() => {
        const response = await getOrder('');

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.')
    })

    it('Failed if user is not the owner of the order', async() => {
        const response = await getOrderById(custToken_1, createdOrderId_2)

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Access denied.');
    });

    it('Success as admin can view any order', async() => {
        const response1 = await getOrderById(adminToken, createdOrderId_1);
        const response2 = await getOrderById(adminToken, createdOrderId_2);

        expect(response1.status && response2.status).toBe(200);
        expect(response1.body && response2.body).toHaveProperty('id');
        expect(response1.body && response2.body).toHaveProperty('status');
    });

    it('Failed on non-existent id', async() => {
        const response = await getOrderById(adminToken, 999813);

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Order not found.')
    });

    it('Failed on missing token (by ID)', async() => {
        const response = await getOrderById('', 999813);

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.')
    })

    afterEach(async() => {
        const adminToken = (await getToken('admin', 'Admin1234!')).access_token;

        if (createdOrderId_1) {
            await deleteOrderById(adminToken, createdOrderId_1);
            createdOrderId_1 = null;
        }

        if (createdOrderId_2) {
            await deleteOrderById(adminToken, createdOrderId_2);
            createdOrderId_2 = null;
        }
    });
});

describe('PATCH /orders', () => {
    let custToken_1, custToken_2, adminToken = '';
    let cartData_1 = [];
    let productId, orderQty, previousQty, createdOrderId_1, createdOrderId_2;

    beforeEach(async() => {
        // clear all orders
        await clearAllOrders();

        // get token for all users
        custToken_1 = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
        custToken_2 = await(await getToken(process.env.CUSTOMER_2_USERNAME, process.env.CUSTOMER_2_PASSWORD)).access_token;
        adminToken = await(await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)).access_token;

        // clear customer carts
        await clearCartData(custToken_1);
        await clearCartData(custToken_2);

        // create product for insufficient stock case
        productId = (await createProductInsufficientStock(adminToken)).productId;

        // get stock before purchase
        previousQty = await (await getProductById(1)).body.stock;

        // fill up stock just in case it drop to 0
        await replenishStock(adminToken, 1);
        await replenishStock(adminToken, 2);

        // fill the cart
        const cartSetup1 = await createCartForOrder(custToken_1, 1, 5);
        const cartSetup2 = await createCartForOrder(custToken_2, 2, 5);

        const orderSetup1 = await createOrder(custToken_1);
        const orderSetup2 = await createOrder(custToken_2);

        createdOrderId_1 = orderSetup1.body.id;
        createdOrderId_2 = orderSetup2.body.id;
    });

    afterEach(async() => {
        const adminToken = (await getToken('admin', 'Admin1234!')).access_token;

        if (createdOrderId_1) {
            await deleteOrderById(adminToken, createdOrderId_1);
            createdOrderId_1 = null;
        }

        if (createdOrderId_2) {
            await deleteOrderById(adminToken, createdOrderId_2);
            createdOrderId_2 = null;
        }
    });

    it('Successfully updated the status to processing', async() => {
        const response = await patchOrderStatus(adminToken, createdOrderId_1, {
            status: 'processing'
        });

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createdOrderId_1);
        expect(response.body.status).toEqual('processing');
    });

    it('Successfully updated the status to shipped', async() => {
        const response = await patchOrderStatus(adminToken, createdOrderId_1, {
            status: 'shipped'
        });

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createdOrderId_1);
        expect(response.body.status).toEqual('shipped');
    });

    it('Successfully updated the status to delivered', async() => {
        const response = await patchOrderStatus(adminToken, createdOrderId_1, {
            status: 'delivered'
        });

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createdOrderId_1);
        expect(response.body.status).toEqual('delivered');
    });

    it('Successfully updated the status to cancelled', async() => {
        const response = await patchOrderStatus(adminToken, createdOrderId_1, {
            status: 'cancelled'
        });

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createdOrderId_1);
        expect(response.body.status).toEqual('cancelled');
    });

    it('Failed on invalid status value', async() => {
        const response = await patchOrderStatus(adminToken, createdOrderId_1, {
            status: 'invalid'
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('status must be one of: pending, processing, shipped, delivered, cancelled.');
    });

    it('Failed on non existent order id', async() => {
        const response = await patchOrderStatus(adminToken, 9991204, {
            status: 'shipped'
        });

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Order not found.');
    });

    it('Failed on using customer token', async() => {
        const response = await patchOrderStatus(custToken_1, createdOrderId_1, {
            status: 'shipped'
        });

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Admin access required.');
    });

    it('Failed on no token', async() => {
        const response = await patchOrderStatus('', createdOrderId_1, {
            status: 'shipped'
        });

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });
});

describe('DELETE /orders', () => {
    let custToken_1, custToken_2, adminToken = '';
    let cartData_1 = [];
    let productId, orderQty, previousQty, createdOrderId_1, createdOrderId_2;

    beforeEach(async() => {
        // clear all orders
        await clearAllOrders();

        // get token for all users
        custToken_1 = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
        custToken_2 = await(await getToken(process.env.CUSTOMER_2_USERNAME, process.env.CUSTOMER_2_PASSWORD)).access_token;
        adminToken = await(await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)).access_token;

        // clear customer carts
        await clearCartData(custToken_1);
        await clearCartData(custToken_2);

        // create product for insufficient stock case
        productId = (await createProductInsufficientStock(adminToken)).productId;

        // get stock before purchase
        previousQty = await (await getProductById(1)).body.stock;

        // fill up stock just in case it drop to 0
        await replenishStock(adminToken, 1);
        await replenishStock(adminToken, 2);

        // fill the cart
        const cartSetup1 = await createCartForOrder(custToken_1, 1, 5);
        const cartSetup2 = await createCartForOrder(custToken_2, 2, 5);

        const orderSetup1 = await createOrder(custToken_1);
        const orderSetup2 = await createOrder(custToken_2);

        createdOrderId_1 = orderSetup1.body.id;
        createdOrderId_2 = orderSetup2.body.id;
    });

    it('Failed as id not found', async() => {
        const response = await deleteOrderById(adminToken, 991024);

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Order not found.');
    });

    it('Failed on using customer token', async() => {
        const response = await deleteOrderById(custToken_1, createdOrderId_1);

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Admin access required.');
    });

    it('Failed on using no token', async() => {
        const response = await deleteOrderById('', createdOrderId_1);

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });

    it('Successfully delete order', async() => {
        const response_1 = await deleteOrderById(adminToken, createdOrderId_1);

        expect(response_1.status).toBe(200);

        const response_2 = await getOrderById(adminToken, createdOrderId_1);
        
        expect(response_2.status).toBe(404);
        expect(response_2.body.error).toEqual('Order not found.')
    });
});