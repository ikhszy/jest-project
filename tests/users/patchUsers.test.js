import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken, normalLogin } from '../helpers/auth.js';
import { createUser, patchUser, deleteUser } from '../../api/users.js';
import { faker } from '@faker-js/faker';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('PATCH /users/:id', () => {
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

    afterAll( async() => {
        await deleteUser(adminToken, userId);
    })

    it('Successfully patch username', async() => {
        const uname = faker.internet.username();
        const reqBody = {
            username: uname
        }

        const response = await patchUser(adminToken, reqBody, userId);

        expect(response.status).toBe(200);
        expect(response.body.username).toEqual(uname);

        uUsername = uname;
    });

    it('Successfully patch email', async() => {
        const email = faker.internet.email();
        const reqBody = {
            email: email
        }

        const response = await patchUser(adminToken, reqBody, userId);

        expect(response.status).toBe(200);
        expect(response.body.email).toEqual(email);
    });

    it('Successfully patch firstname', async() => {
        const fname = faker.person.firstName();
        const reqBody = {
            first_name: fname
        }

        const response = await patchUser(adminToken, reqBody, userId);

        expect(response.status).toBe(200);
        expect(response.body.first_name).toEqual(fname);
    });

    it('Successfully patch lastname', async() => {
        const lname = faker.person.lastName();
        const reqBody = {
            last_name: lname
        }

        const response = await patchUser(adminToken, reqBody, userId);

        expect(response.status).toBe(200);
        expect(response.body.last_name).toEqual(lname);
    });

    it('Successfully patch role', async() => {
        const reqBody = {
            role: 'admin'
        }

        const response = await patchUser(adminToken, reqBody, userId);

        expect(response.status).toBe(200);
        expect(response.body.role).toEqual('admin');
    });

    it('Successfully patch password', async() => {
        const reqBody = {
            password: 'Password1234!'
        }

        const response = await patchUser(adminToken, reqBody, userId);

        expect(response.status).toBe(200);
        expect(response.body.role).not.toHaveProperty('password')

        const loginresponse = await normalLogin(uUsername, 'Password1234!');

        expect(loginresponse.status).toBe(200);
        expect(loginresponse.body).toHaveProperty('access_token');
    });

    it('Failed on username has been used', async() => {
        const reqBody = {
            username: 'bob'
        }

        const response = await patchUser(adminToken, reqBody, userId);

        expect(response.status).toBe(409);
        expect(response.body.error).toEqual('A record with that value already exists.');
    });

    it('Failed on invalid role', async() => {
        const reqBody = {
            role: 'invalid'
        }

        const response = await patchUser(adminToken, reqBody, userId);

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('role must be one of: customer, admin.');
    });

    it('Failed on using customer token', async() => {
        const reqBody = {
            password: 'Password1234!'
        }

        const response = await patchUser(custToken, reqBody, userId);

        expect(response.status).toBe(403);
        expect(response.body.error).toEqual('Admin access required.');
    });

    it('Failed on invalid token', async() => {
        const reqBody = {
            password: 'Password1234!'
        }

        const response = await patchUser('', reqBody, userId);

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });
});