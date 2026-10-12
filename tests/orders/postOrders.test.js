import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { faker } from "@faker-js/faker";
import { getToken } from '../helpers/auth.js';
import { getProductById, createProductInsufficientStock, patchProductById, replenishStock } from '../helpers/products.js';
import { clearCartData, getCartData, createCartForOrder } from '../helpers/cart.js';
import { getOrder, createOrder, createOrderWithBody, deleteOrderById, clearAllOrders } from '../../api/order.js';

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
        custToken_1 = await(await getToken('alice', 'Password1!')).access_token;
        custToken_2 = await(await getToken('bob', 'Password1!')).access_token;
        adminToken = await(await getToken('admin', 'Admin1234!')).access_token;

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