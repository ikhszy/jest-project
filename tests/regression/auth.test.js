import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth.js';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('POST /auth/register', () => {
    const dupeUsername = `testuser_${Date.now()}`;
    const dupeEmail = dupeUsername + '@mail.com';
    
    it('should register new user', async () => {
        const response = await request.post('/auth/register')
        .send({
            username: dupeUsername,
            email: dupeEmail,
            password: 'password1',
            first_name: 'test',
            last_name: 'user'
        });

        expect(response.status).toBe(201);
        expect(response.body.user.username).toEqual(dupeUsername);
        expect(response.body.user).toHaveProperty('id');
    });

    it('should failed on duplicate username', async() => {
        const response = await request.post('/auth/register')
        .send({
            username: dupeUsername,
            email: `testuser_${Date.now()}@mail.com`,
            password: 'password1',
            first_name: 'duplicate',
            last_name: 'username'
        });

        expect(response.status).toBe(409);
        expect(response.body.error).toEqual('A record with that value already exists.')
    });

    it('should failed on duplicate email', async() => {
        const response = await request.post('/auth/register')
        .send({
            username: `testuser_${Date.now()}`,
            email: dupeEmail,
            password: 'password1',
            first_name: 'duplicate',
            last_name: 'username'
        });

        expect(response.status).toBe(409);
        expect(response.body.error).toEqual('A record with that value already exists.')
    });

    it('should failed on missing username', async() => {
        const response = await request.post('/auth/register')
        .send({
            username: '',
            email: dupeEmail,
            password: 'password1',
            first_name: 'duplicate',
            last_name: 'username'
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: username.')
    });

    it('should failed on missing email', async () => {
        const response = await request.post('/auth/register')
        .send({
            username: dupeUsername,
            email: '',
            password: 'password1',
            first_name: 'test',
            last_name: 'user'
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: email.')
    });

    it('should failed on missing first name', async () => {
        const response = await request.post('/auth/register')
        .send({
            username: dupeUsername,
            email: dupeEmail,
            password: 'password1',
            first_name: '',
            last_name: 'user'
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: first_name.')
    });

    it('should failed on missing last name', async () => {
        const response = await request.post('/auth/register')
        .send({
            username: dupeUsername,
            email: dupeEmail,
            password: 'password1',
            first_name: 'test',
            last_name: ''
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: last_name.')
    });
});

describe('POST /auth/login', () => {

    // test data
    const adminUsername = 'admin';
    const adminPassword = 'Admin1234!';

    const customerUsername = 'alice';
    const customerPassword = 'Password1!';

    it('should successfully login as Administrator', async() => {
        const response = await request.post('/auth/login')
        .send({
            username: adminUsername,
            password: adminPassword
        });

        console.log(response.body);
        
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('refresh_token');
        expect(response.body.user.role).toEqual('admin');
        expect(response.status).toBe(200);
    })

    it('should successfully login as customer', async () => {
        const response = await request.post('/auth/login')
        .send({
            username: customerUsername,
            password: customerPassword
        });
        
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('refresh_token');
        expect(response.body.user.role).toEqual('customer');
        expect(response.status).toBe(200);
    });

    it('should failed login on username not found', async () => {
        const response = await request.post('/auth/login')
        .send({
            username: 'username not found',
            password: customerPassword
        });
        
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid credentials.');
    });

    it('should failed login on wrong password', async () => {
        const response = await request.post('/auth/login')
        .send({
            username: customerUsername,
            password: 'wrong password'
        });
        
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid credentials.');
    });

    it('should failed login on empty username', async () => {
        const response = await request.post('/auth/login')
        .send({
            username: '',
            password: customerPassword
        });

        console.log(response.body);
        
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: username.');
    });

    it('should failed login on empty password', async () => {
        const response = await request.post('/auth/login')
        .send({
            username: customerUsername,
            password: ''
        });

        console.log(response.body);
        
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: password.');
    });
})

describe('GET /auth/me', () => {
    const customerUsername = 'bob';
    const customerPassword = 'Password1!';
    let access_token = '';
    beforeAll(async () => {
        ({ access_token } = await getToken(customerUsername, customerPassword));
    });

    it('should success with valid token', async () => {
        const response = await request.get('/auth/me')
        .set({
            'authorization': `Bearer ${access_token}`,
            "content-type": 'application/json'
        })

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.username).toEqual('bob');
    });

    it('should failed with no token', async () => {
        const response = await request.get('/auth/me')
        .set({
            'authorization': '',
            "content-type": 'application/json'
        })

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });

    it('should failed with malformed token', async () => {
        const response = await request.get('/auth/me')
        .set({
            'authorization': 'wrong token',
            "content-type": 'application/json'
        })
        
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });
});

describe('POST /auth/refresh', () => {

    const customerUsername = 'alice';
    const customerPassword = 'Password1!';
    let fresh_token = '';
    beforeAll(async () => {
        fresh_token = (await getToken(customerUsername, customerPassword)).refresh_token;
    });

    it('return new tokens and invalidate old refresh token', async() => {
        // First refresh — should succeed and rotate the token
        const response1 = await request.post('/auth/refresh')
            .send({ refresh_token: fresh_token });

        expect(response1.status).toBe(200);
        expect(response1.body).toHaveProperty('access_token');
        expect(response1.body).toHaveProperty('refresh_token');

        // Same token again — should now be revoked
        const response2 = await request.post('/auth/refresh')
            .send({ refresh_token: fresh_token });

        expect(response2.status).toBe(401);
    });

    it('return error on invalid refresh_token', async() => {
        const response = await request.post('/auth/refresh')
            .send({ refresh_token: 'fresh_token' });

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid or expired refresh token.');
    });

    it('return error on missing refresh token', async() => {
        const response = await request.post('/auth/refresh')
            .send({ refresh_token: '' });
        
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('refresh_token is required.');
    });
});

describe('POST /auth/logout', () => {
    const customerUsername = 'alice';
    const customerPassword = 'Password1!';
    let access_token_res = '';
    let refresh_token_res = '';
    
    beforeEach(async () => {
        ({ access_token: access_token_res, refresh_token: refresh_token_res } = await getToken(customerUsername, customerPassword));
    });

    it('Successfully logged out', async() => {
        const response = await request.post('/auth/logout')
            .set({
                "content-type": "application/json"
            })
            .send({
                "refresh_token": refresh_token_res
            })
        
        expect(response.status).toBe(200);
        expect(response.body.message).toEqual('Logged out successfully.');
    });

    it('Refresh token revoked after logout', async() => {
        const response1 = await request.post('/auth/logout')
            .set({
                "content-type": "application/json"
            })
            .send({
                "refresh_token": refresh_token_res
            })
        
        expect(response1.status).toBe(200);
        expect(response1.body.message).toEqual('Logged out successfully.');

        const response2 = await request.post('/auth/refresh')
            .send({ refresh_token: refresh_token_res });

        expect(response2.status).toBe(401);
        expect(response2.body.error).toEqual('Refresh token has been revoked.');
    });

    it.skip('return failed on missing refresh_token -- bug on API', async() => {
        const response = await request.post('/auth/logout')
            .send({
                "refresh_token": ''
            })
        
        console.log(response.body);
    })
})