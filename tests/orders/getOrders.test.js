import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { getProductById, createProductInsufficientStock, replenishStock } from '../helpers/products.js';
import { clearCartData, createCartForOrder } from '../helpers/cart.js';
import { getOrder, getOrderById, getOrderWithParam, createOrder, deleteOrderById, clearAllOrders } from '../../api/order.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('GET /orders', () => {

    let custToken_1, custToken_2, adminToken = '';
    let cartData_1 = [];
    let productId, orderQty, previousQty, createdOrderId_1, createdOrderId_2;

    beforeEach(async() => {
        // clear all orders
        await clearAllOrders();

        // get token for all users
        custToken_1 = await(await getToken('alice', 'Password1!')).access_token;
        custToken_2 = await(await getToken('bob', 'Password1!')).access_token;
        adminToken = await(await getToken('admin', 'Admin1234!')).access_token;

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

        console.log(response.body);

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