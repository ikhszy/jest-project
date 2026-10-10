import supertest from "supertest";
import dotenv from 'dotenv';

dotenv.config();

const request = supertest(process.env.BASE_URL);

// POST /auth/login
export async function postLogin(body) {
    return request.post('/auth/login')
    .set({
        "content-type": 'application/json'
    })
    .send(body);
}

export async function postRegister(body) {
    return request.post('/auth/register')
    .set({
        contentType: 'application/json'})
    .send(body);
}

export async function postLogout(body) {
    return request.post('/auth/logout')
    .send(body)
}

export async function getMe(token) {
    return request.get('/auth/me')
    .set({
        Authorization: `Bearer ${token}`,
        contentType: 'application/json'
    });
}

export async function postRefresh(token) {
    return request.post('/auth/refresh')
    .set({
        contentType: 'application/json'
    })
    .send(token);
}