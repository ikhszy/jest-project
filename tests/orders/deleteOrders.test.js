import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { getProductById, createProductInsufficientStock, replenishStock } from '../helpers/products.js';
import { clearCartData, createCartForOrder } from '../helpers/cart.js';
import { getOrder, getOrderById, createOrder, deleteOrderById, clearAllOrders } from '../../api/order.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('DELETE /orders', () => {
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