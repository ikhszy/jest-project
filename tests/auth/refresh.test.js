import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth';
import { postRefresh } from '../../api/auth';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('POST /auth/refresh', () => {

    const customerUsername = 'alice';
    const customerPassword = 'Password1!';
    let fresh_token = '';
    beforeAll(async () => {
        fresh_token = (await getToken(customerUsername, customerPassword)).refresh_token;
    });

    it('return new tokens and invalidate old refresh token', async() => {
        // First refresh — should succeed and rotate the token
        const response1 = await postRefresh(fresh_token)

        expect(response1.status).toBe(200);
        expect(response1.body).toHaveProperty('access_token');
        expect(response1.body).toHaveProperty('refresh_token');

        // Same token again — should now be revoked
        const response2 = await postRefresh(fresh_token)

        expect(response2.status).toBe(401);
    });

    it('return error on invalid refresh_token', async() => {
        const response = await postRefresh('fresh_token')

        expect(response.status).toBe(401);
        expect(response.body.error).toEqual('Invalid or expired refresh token.');
    });

    it('return error on missing refresh token', async() => {
        const response = await postRefresh('')
        
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('refresh_token is required.');
    });
});