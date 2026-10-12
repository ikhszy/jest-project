import supertest from "supertest";
import dotenv from 'dotenv';
import { getProductData } from './products.js';
import { createCart } from '../../api/cart.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

export async function clearCartData(token) {
    return await request.delete('/cart')
    .set({
        authorization: `Bearer ${token}`
    });
}

export async function getCartData(token) {
    return await request.get('/cart')
    .set({
        Authorization: `Bearer ${token}`,
        accept: 'application/json'
    });
}

export async function createCartData(token) {
    let cartItems = [];
    let cartId, cartTotal;

    await clearCartData(token);

    const products = await Promise.all(
        Array.from({ length: 5 }, (_, i) => getProductData(i + 1))
    );

    await Promise.all(
        products.map(prod => createCart(token, {
            product_id: prod.productId,
            quantity: Math.floor(Math.random() * 10) + 1
        }))
    );

    const response = await getCartData(token);
    cartItems = response.body.items;
    cartTotal = response.body.total;
    cartId = response.body.id;

    return { cartItems, cartTotal, cartId };
}

export async function createCartForOrder(token, id, qty) {
    const response = await request.post('/cart/items')
    .set({
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
        accept: 'application/json'
    })
    .send({
        product_id: id,
        quantity: qty
    });

    return response;
}
