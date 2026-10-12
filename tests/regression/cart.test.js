import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { getProductData } from '../helpers/products.js';
import { getCart, createCart, deleteCart, patchCart, deleteCartItems } from '../../api/cart.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('GET cart', () => {
    
    let custToken = '';

    beforeAll(async() => {
        custToken = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
    })
    
    it('Successfully shows cart', async() => {
        const response = await getCart(custToken);

        expect(response.status).toBe(200);
        expect(response.body.items.length).toBeGreaterThanOrEqual(1);
        expect(response.body.items[0]).toHaveProperty('cart_item_id');
    });

    it('failed on wrong token', async() => {
        const response = await getCart('wrong token');

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid access token.');
    });

    it('failed on no token', async() => {
        const response = await getCart('');

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });
});

describe('POST cart', () => {
    let custToken = '';
    let prodId, qty;

    beforeAll(async() => {
        custToken = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
        prodId = (await (getProductData(1))).productId;
        qty = Math.floor(Math.random() * 10) + 1;

        // clear cart first
        await deleteCart(custToken);
    })

    it('Successfully add single item to cart', async() => {
        const response = await createCart(custToken, {
            product_id: prodId,
            quantity: qty
        });

        expect(response.status).toBe(201);
        expect(response.body.items[0].product_id).toBe(prodId);
        expect(response.body.items[0].quantity).toBe(qty);
    });

    it('add same product again and quantity increased', async() => {
        const response = await createCart(custToken, {
            product_id: prodId,
            quantity: 1
        });

        expect(response.status).toBe(201);
        expect(response.body.items[0].product_id).toBe(prodId);
        expect(response.body.items[0].quantity).toBe(qty + 1);
    });

    it('Return error as no product ID', async() => {
        const response = await createCart(custToken, {
            product_id: '',
            quantity: qty
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('product_id is required.');
    });

    it('Return error as no quantity', async() => {
        const response = await createCart(custToken, {
            product_id: prodId,
            quantity: 0
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('quantity must be a positive integer.');
    });

    it('Return error as product ID not found', async() => {
        const response = await createCart(custToken, {
            product_id: 999120,
            quantity: 5
        });

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Product not found.');
    });

    it('Return error as request sent with invalid token', async() => {
        const response = await createCart('custToken', {
            product_id: 1,
            quantity: 5
        });

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid access token.');
    });
});

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

describe('DELETE /cart/items/:productId', () => {
    let custToken = '';
    let custCart = '';
    let cartTotal, carts;
    let cartItems = [];

    beforeAll(async() => {
        custToken = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;

        // clear cart first
        await deleteCart(custToken);

        // fetch all product IDs at the same time
        const products = await Promise.all(
            Array.from({ length: 5}, (_, i) => getProductData(i + 1))
        );

        // add all items to cart in parallel
        const responses = await Promise.all(
            products.map(prod => createCart(custToken, {
                product_id: prod.productId,
                quantity: Math.floor(Math.random() * 10) + 1
            }))
        );

        // save the final cart state once
        const response = await getCart(custToken);
        cartItems = response.body.items;
        cartTotal = response.body.total;
    });

    it('successfully delete item from cart', async() => {
        const cartId = cartItems[0].product_id;
        const cartLength = cartItems.length;

        const response = await deleteCartItems(custToken, cartId);

        // verify status, items length, and cart total
        expect(response.status).toBe(200);
        expect(response.body.items.length).toBeLessThan(cartLength);
        expect(response.body.total).toBeLessThan(cartTotal);

        // verify product_id is removed from cart
        response.body.items.forEach(item => {
            expect(item.product_id).not.toBe(cartId);
        });
    });

    it('Failed on non existing product_id', async() => {
        const response = await deleteCartItems(custToken, 92292992);

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('Item not in cart.')
    });

    it('Failed on non existing token', async() => {
        const cartId = cartItems[0].product_id;

        const response = await deleteCartItems('', cartId);

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.')
    });
});