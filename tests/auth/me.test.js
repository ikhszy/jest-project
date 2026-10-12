import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth';
import { getMe } from '../../api/auth';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('GET /auth/me', () => {
    const customerUsername =process.env.CUSTOMER_2_USERNAME;
    const customerPassword = process.env.CUSTOMER_2_PASSWORD;
    let access_token = '';
    beforeAll(async () => {
        ({ access_token } = await getToken(customerUsername, customerPassword));
    });

    it('should success with valid token', async () => {
        const response = await getMe(access_token)

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.username).toEqual('bob');
    });

    it('should failed with no token', async () => {
        const response = await getMe('')

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Missing or malformed Authorization header.');
    });

    it('should failed with malformed token', async () => {
        const response = await getMe('wrong token :)')
        
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid access token.');
    });
});