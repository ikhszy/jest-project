import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth';
import { postLogin } from '../../api/auth';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('POST /auth/login', () => {

    // test data
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminRequest = {
            username: adminUsername,
            password: adminPassword
        }

    const customerUsername = process.env.CUSTOMER_1_USERNAME;
    const customerPassword = process.env.CUSTOMER_1_PASSWORD;
    const custRequest = {
        username: customerUsername,
            password: customerPassword
    }

    it('should successfully login as Administrator', async() => {
        const response = await postLogin(adminRequest);

        console.log(response.body);
        
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('refresh_token');
        expect(response.body.user.role).toEqual('admin');
        expect(response.status).toBe(200);
    })

    it('should successfully login as customer', async () => {
        const response = await postLogin(custRequest);
        
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('refresh_token');
        expect(response.body.user.role).toEqual('customer');
        expect(response.status).toBe(200);
    });

    it('should failed login on username not found', async () => {
        const response = await postLogin({
            username: 'not found?',
            password: adminPassword
        })
        
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid credentials.');
    });

    it('should failed login on wrong password', async () => {
        const response = await postLogin({
            username: adminUsername,
            password: 'wrong password haha'
        })
        
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid credentials.');
    });

    it('should failed login on empty username', async () => {
        const response = await postLogin({
            username: '',
            password: adminPassword
        })

        console.log(response.body);
        
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: username.');
    });

    it('should failed login on empty password', async () => {
        const response = await postLogin({
            username: adminUsername,
            password: ''
        })

        console.log(response.body);
        
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: password.');
    });
});