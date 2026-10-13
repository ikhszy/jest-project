import supertest from "supertest";
import dotenv from 'dotenv';

dotenv.config();

const request = supertest(process.env.BASE_URL);

// GET all users
export async function getUsers(token, param={}) {
    return request.get('/users')
    .set({
        accept: 'application/json',
        Authorization: `Bearer ${token}`
    }).query(param);
};

// GET user by ID
export async function getUsersById(token, id) {
    return request.get(`/users/${id}`)
    .set({
        accept: 'application/json',
        Authorization: `Bearer ${token}`
    });
};

// POST user
export async function createUser(token, body) {
    return request.post('/users')
    .set({
        Authorization: `Bearer ${token}`,
        "content-type": 'application/json'
    })
    .send(body);
};

// PATCH user
export async function patchUser(token, body, id) {
    return request.patch(`/users/${id}`)
    .set({
        Authorization: `Bearer ${token}`,
        "content-type": 'application/json'
    })
    .send(body);
};

// PUT user
export async function putUser(token, body, id) {
    return request.put(`/users/${id}`)
    .set({
        Authorization: `Bearer ${token}`,
        "content-type": 'application/json'
    })
    .send(body);
};

// DELETE user
export async function deleteUser(token, id) {
    return request.delete(`/users/${id}`)
    .set({
        Authorization: `Bearer ${token}`
    });
};