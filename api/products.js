import supertest from "supertest";
import dotenv from 'dotenv';

dotenv.config();

const request = supertest(process.env.BASE_URL);

// GET all products
export async function getProducts(query = {}) {
    return request.get('/products').query(query);
}

// GET product by ID
export async function getProductById(id) {
    return request.get(`/products/${id}`);
}

// POST product
export async function createProduct(token, body) {
    return request.post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
}

// PUT product
export async function updateProduct(token, id, body) {
    return request.put(`/products/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);
}

// PATCH product
export async function patchProduct(token, id, body) {
    return request.patch(`/products/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);
}

// DELETE product
export async function deleteProduct(token, id) {
    return request.delete(`/products/${id}`)
        .set('Authorization', `Bearer ${token}`);
}
