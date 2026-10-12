import supertest from "supertest";
import dotenv from 'dotenv';
import { faker } from "@faker-js/faker";
import { getToken } from '../tests/helpers/auth.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

// GET Order
export async function getOrder(token) {
    return request.get('/orders')
    .set({
        Authorization: `Bearer ${token}`
    });
};

// GET Order with param
export async function getOrderWithParam(token, query = {}) {
    return request.get('/orders')
    .query(query)
    .set({
        Authorization: `Bearer ${token}`
    });
};

export async function getOrderById(token, orderId) {
    return request.get(`/orders/${orderId}`)
    .set({
        Authorization: `Bearer ${token}`
    });
};

export async function createOrder(token) {
    return request.post('/orders')
    .set({
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json'
    }).send({
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode()
    });
};

export async function createOrderWithBody(token, body) {
    return request.post('/orders')
    .set({
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json'
    }).send(body);
}

export async function patchOrderStatus(token, id, body) {
    return request.patch(`/orders/${id}/status`)
    .set({
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json'
    }).send(body);
};

export async function deleteOrderById(token, id) {
    return request.delete(`/orders/${id}`)
    .set({
        Authorization: `Bearer ${token}`
    })
};

export async function clearAllOrders() {
    const adminToken = (await getToken('admin', 'Admin1234!')).access_token;

    const response = await getOrder(adminToken);
    const orders = response.body.data;

    if (!orders || orders.length === 0) return;

    await Promise.all(
        orders.map(order => deleteOrderById(adminToken, order.id))
    );
}