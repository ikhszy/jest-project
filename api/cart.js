import supertest from "supertest";
import dotenv from 'dotenv';

dotenv.config();

const request = supertest(process.env.BASE_URL);

// GET cart
export async function getCart(token) {
    return request.get('/cart')
    .set({
        accept: 'application/json',
        authorization: `Bearer ${token}`
    });
}

// POST cart/items
export async function createCart(token, body) {
    return request.post('/cart/items')
    .set({
        "content-type": "application/json",
        authorization: `Bearer ${token}`
    })
    .send(body);
}

// PATCH cart/items/:product_id
export async function patchCart(token, productId, body) {
    return request.patch(`/cart/items/${productId}`)
    .set({
        "content-type": "application/json",
        authorization: `Bearer ${token}`
    })
    .send(body);
}

// DELETE cart/items/:product_id
export async function deleteCartItems(token, productId) {
    return request.delete(`/cart/items/${productId}`)
    .set({
        authorization: `Bearer ${token}`
    })
}
// DELETE cart
export async function deleteCart(token) {
    return request.delete('/cart')
    .set({
        authorization: `Bearer ${token}`
    })
}