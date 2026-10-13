import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken, normalLogin } from '../helpers/auth.js';
import { getUsers, getUsersById, createUser, patchUser, deleteUser } from '../../api/users.js';
import { faker } from '@faker-js/faker';

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
        expect(response.body.message).toEqual('User deleted.');

        const loginResponse = await normalLogin(uUsername, uPassword);

        expect(loginResponse.status).toBe(401);
        expect(loginResponse.body.error).toEqual('Invalid credentials.');
    })
});