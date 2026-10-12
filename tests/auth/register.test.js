import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth';
import { postRegister } from '../../api/auth';

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('POST /auth/register', () => {
    const dupeUsername = `testuser_${Date.now()}`;
    const dupeEmail = dupeUsername + '@mail.com';
    const passRegister = process.env.CUSTOMER_1_PASSWORD;
    
    it('should register new user', async () => {
        const response = await postRegister({
            username: dupeUsername,
            email: dupeEmail,
            password: passRegister,
            first_name: 'test',
            last_name: 'user'
        })

        expect(response.status).toBe(201);
        expect(response.body.user.username).toEqual(dupeUsername);
        expect(response.body.user).toHaveProperty('id');
    });

    it('should failed on duplicate username', async() => {
        const response = await postRegister({
            username: dupeUsername,
            email: `testuser_${Date.now()}@mail.com`,
            password: passRegister,
            first_name: 'duplicate',
            last_name: 'username'
        })

        expect(response.status).toBe(409);
        expect(response.body.error).toEqual('A record with that value already exists.')
    });

    it('should failed on duplicate email', async() => {
        const response = await postRegister({
            username: `testuser_${Date.now()}`,
            email: dupeEmail,
            password: passRegister,
            first_name: 'duplicate',
            last_name: 'username'
        })

        expect(response.status).toBe(409);
        expect(response.body.error).toEqual('A record with that value already exists.')
    });

    it('should failed on missing username', async() => {
        const response = await postRegister({
            username: '',
            email: dupeEmail,
            password: passRegister,
            first_name: 'duplicate',
            last_name: 'username'
        })

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: username.')
    });

    it('should failed on missing email', async () => {
        const response = await postRegister({
            username: dupeUsername,
            email: '',
            password: passRegister,
            first_name: 'test',
            last_name: 'user'
        })

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: email.')
    });

    it('should failed on missing first name', async () => {
        const response = await postRegister({
            username: dupeUsername,
            email: dupeEmail,
            password: passRegister,
            first_name: '',
            last_name: 'user'
        })

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: first_name.')
    });

    it('should failed on missing last name', async () => {
        const response = await postRegister({
            username: dupeUsername,
            email: dupeEmail,
            password: passRegister,
            first_name: 'test',
            last_name: ''
        })

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual('Missing required fields: last_name.')
    });
});