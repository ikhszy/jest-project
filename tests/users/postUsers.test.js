import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken, normalLogin } from '../helpers/auth.js';
import { createUser } from '../../api/users.js';
import { faker } from '@faker-js/faker';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('POST /users', () => {
    let adminToken, custToken, userId;

    // for body request purpose
    let uUsername, uEmail, uPassword, uFirstname, uLastname, uRole;

    beforeAll(async() => {
        adminToken = await(await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)).access_token;
        custToken = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;
    });

    beforeEach( async() => {
        // generate user data with faker
        uUsername = faker.internet.username();
        uEmail = faker.internet.email();
        uPassword = faker.internet.password( { length: 10 });
        uFirstname = faker.person.firstName();
        uLastname = faker.person.lastName();
    })

    it('Successfully add new user as admin', async() => {
        const reqBody = {
            username: uUsername,
            email: uEmail,
            password: uPassword,
            first_name: uFirstname,
            last_name: uLastname,
            role: 'admin'
        }

        const response = await createUser(adminToken, reqBody);

        expect(response.status).toBe(201);
        expect(response.body).not.toHaveProperty('password');
        expect(response.body.username).toEqual(uUsername);
        expect(response.body.email).toEqual(uEmail);
        expect(response.body.role).toEqual('admin');

        const loginResponse = await normalLogin(uUsername, uPassword);

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('access_token');
    });

    it('Successfully add new user as customer', async() => {
        const reqBody = {
            username: uUsername,
            email: uEmail,
            password: uPassword,
            first_name: uFirstname,
            last_name: uLastname,
            role: 'customer'
        };

        const response = await createUser(adminToken, reqBody);

        expect(response.status).toBe(201);
        expect(response.body).not.toHaveProperty('password');
        expect(response.body.username).toEqual(uUsername);
        expect(response.body.email).toEqual(uEmail);
        expect(response.body.role).toEqual('customer');

        const loginResponse = await normalLogin(uUsername, uPassword);

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('access_token');

        userId = response.body.id;
    });

    it('Failed as using customer token', async() => {
        const reqBody = {
            username: uUsername,
            email: uEmail,
            password: uPassword,
            first_name: uFirstname,
            last_name: uLastname,
            role: 'admin'
        }

        const response = await createUser(custToken, reqBody);

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Admin access required.');
    });

    it('Failed as using invalid token', async() => {
        const reqBody = {
            username: uUsername,
            email: uEmail,
            password: uPassword,
            first_name: uFirstname,
            last_name: uLastname,
            role: 'admin'
        }

        const response = await createUser('', reqBody);

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });

    it('Failed as missing required properties', async() => {
        const reqBody = {

        };

        const response = await createUser(adminToken, reqBody);

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: username, email, password, first_name, last_name.');
    });

    it('failed as username has been used before', async() => {
        const reqBody = {
            username: 'alice',
            email: uEmail,
            password: uPassword,
            first_name: uFirstname,
            last_name: uLastname,
            role: 'admin'
        }

        const response = await createUser(adminToken, reqBody);

        expect(response.status).toBe(409);
        expect(response.body.error).toEqual('A record with that value already exists.');
    });

    it('failed as role not found', async() => {
        const reqBody = {
            username: uUsername,
            email: uEmail,
            password: uPassword,
            first_name: uFirstname,
            last_name: uLastname,
            role: 'invalid'
        }

        const response = await createUser(adminToken, reqBody);

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('role must be one of: customer, admin.');
    });
});