import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { getProductById, createProductInsufficientStock, replenishStock } from '../helpers/products.js';
import { clearCartData, createCartForOrder } from '../helpers/cart.js';
import { getOrder, createOrder, patchOrderStatus, deleteOrderById, clearAllOrders } from '../../api/order.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

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