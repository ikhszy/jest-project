import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken, normalLogin } from '../helpers/auth.js';
import { createUser, deleteUser } from '../../api/users.js';
import { faker } from '@faker-js/faker';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('DELETE /users/:id', () => {
    let adminToken, custToken, userId;

    // for request body purpose
    let uUsername, uEmail, uPassword, uFirstname, uLastname, uRole;

    beforeAll(async() => {
        adminToken = await(await getToken(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD)).access_token;
        custToken = await(await getToken(process.env.CUSTOMER_1_USERNAME, process.env.CUSTOMER_1_PASSWORD)).access_token;

        // generate user data with faker
        uUsername = faker.internet.username();
        uEmail = faker.internet.email();
        uPassword = faker.internet.password( { length: 10 });
        uFirstname = faker.person.firstName();
        uLastname = faker.person.lastName();

        // create user for data dependancy
        const reqBody = {
            username: uUsername,
            email: uEmail,
            password: uPassword,
            first_name: uFirstname,
            last_name: uLastname,
            role: 'customer'
        }

        userId = await(await createUser(adminToken, reqBody)).body.id;
    });

    it('Failed on using customer token', async() => {
        const response = await deleteUser(custToken, userId);

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Admin access required.');
    });

    it('Failed on invalid token', async() => {
        const response = await deleteUser('', userId);

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });

    it('Failed on id not found', async() => {
        const response = await deleteUser(adminToken, 999120);

        expect(response.status).toBe(404);
        expect(response.body.error).toEqual('User not found.');
    });

    it('Successfully delete a user', async() => {
        const response = await deleteUser(adminToken, userId);

        expect(response.status).toBe(200);

        const loginResponse = await normalLogin(uUsername, uPassword);

        expect(loginResponse.status).toBe(401);
        expect(loginResponse.body.error).toEqual('Invalid credentials.');
    })
});