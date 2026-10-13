import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';
import { getUsers, getUsersById } from '../../api/users.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('GET /users', () => {

    let adminToken, custToken;

    beforeAll(async() => {
        adminToken = await(await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)).access_token;
        custToken = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
    });

    it('Successfully shows all users as admin', async() => {
        const response = await getUsers(adminToken);

        expect(response.status).toBe(200);
        response.body.data.forEach(res => {
            expect(res).toHaveProperty('username');
            expect(res).toHaveProperty('email');
            expect(res).toHaveProperty('role');
        });
    });

    it('Successfully shows all users using pagination and limit', async() => {
        const response = await getUsers(adminToken, {
            limit: 20,
            page: 2
        });

        expect(response.status).toBe(200);
        expect(response.body.pagination.limit).toBe(20);
        expect(response.body.pagination.page).toBe(2);
        response.body.data.forEach(res => {
            expect(res).toHaveProperty('username');
            expect(res).toHaveProperty('email');
            expect(res).toHaveProperty('role');
        });
    });

    it('Successfully use search using text', async() => {
        const response = await getUsers(adminToken, {
            search: 'testuser',
            limit: 100,
            page: 1
        });

        expect(response.status).toBe(200);
        response.body.data.forEach(res => {
            expect(res.email).toContain('testuser');
        });
    });

    it('Successfully search by role', async() => {
        const response = await getUsers(adminToken, {
            role: 'customer',
            limit: 100,
            page: 1
        });

        expect(response.status).toBe(200);
        response.body.data.forEach(res => {
            expect(res.role).toEqual('customer');
        });
    });

    it('Successfully use search on email', async() => {
        const response = await getUsers(adminToken, {
            search: 'alice@example.com'
        });

        expect(response.status).toBe(200);
        response.body.data.forEach(res => {
            expect(res.email).toContain('alice@example.com');
        });
    });

    it('failed as using customer token', async() => {
        const response = await getUsers(custToken, {
            limit: 20,
            page: 2
        });

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Admin access required.');
    });
    
    it('Failed as using empty token', async() => {
        const response = await getUsers('', {
            limit: 20,
            page: 2
        });

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });

    it('Shows empty data as page is outside of range', async() => {
        const response = await getUsers(adminToken, {
            limit: 20,
            page: 20
        });

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(0);
    });
});

describe('GET /users/:id', () => {
    let adminToken, custToken;

    beforeAll(async() => {
        adminToken = await(await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)).access_token;
        custToken = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
    });

    it('Success getting user by ID', async() => {
        const response = await getUsersById(adminToken, 2);

        expect(response.status).toBe(200);
        expect(response.body.id).toEqual(2);
        expect(response.body).toHaveProperty('username');
        expect(response.body).toHaveProperty('email');
        expect(response.body).toHaveProperty('role');
    });

    it('Failed as user id not found', async() => {
        const response = await getUsersById(adminToken, 799);

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('User not found.');
    });

    it('Failed using customer token', async() => {
        const response = await getUsersById(custToken, 2);

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Admin access required.');
    });

    it('Failed as token is invalid', async() => {
        const response = await getUsersById('', 2);

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });
});