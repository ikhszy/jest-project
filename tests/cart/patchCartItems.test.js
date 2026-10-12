import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { getProductData } from '../helpers/products.js';
import { getCart, createCart, deleteCart, patchCart } from '../../api/cart.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('PATCH cart/items/:productId', () => {
    let custToken = '';
    let custCart = '';
    let prodId, qty, cartOrder;

    // cart item data
    let cartItemId, cartItemQuantity, cartItemProductId, cartItemName,
        cartItemCategory, cartItemPrice, cartItemStock, cartItemSubtotal,
        cartItemTotal;

    beforeAll(async() => {
        custToken = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
        prodId = (await (getProductData(1))).productId;
        qty = Math.floor(Math.random() * 10) + 1;

        // clear cart first
        await deleteCart(custToken);

        // add items to the cart
        const carts = await createCart(custToken, {
            product_id: prodId,
            quantity: qty
        });

        // assign variables for future uses
        cartItemId = carts.body.items[0].cart_item_id;
        cartItemQuantity = carts.body.items[0].quantity;
        cartItemProductId = carts.body.items[0].product_id;
        cartItemName = carts.body.items[0].name;
        cartItemCategory = carts.body.items[0].category;
        cartItemPrice = carts.body.items[0].price;
        cartItemStock = carts.body.items[0].stock;
        cartItemSubtotal = carts.body.items[0].subtotal;
        cartItemTotal = carts.body.total;
    });

    it('Successfully patch the item quantity', async() => {
        const response = await patchCart(custToken, prodId, {
            quantity: 10
        });

        expect(response.status).toBe(200);
        expect(response.body.items[0].quantity).toEqual(10);
        expect(response.body.items[0].subtotal).toBeCloseTo((response.body.items[0].price * 10), 2);
    });

    it('Failed to patch a non-existent productId', async() => {
        const response = await patchCart(custToken, 931813, {
            quantity: 10
        });

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Item not in cart.');
    });

    it('Failed to patch with invalid token', async() => {
        const response = await patchCart('custToken', prodId, {
            quantity: 10
        });

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid access token.');
    });

    it('removed item when quantity set to 0', async() => {
        const response = await patchCart(custToken, prodId, {
            quantity: 0
        });

        expect(response.status).toBe(200);
        expect(response.body.items.length).toBe(0);
    });
});