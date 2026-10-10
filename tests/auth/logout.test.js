import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';
import { getToken } from '../helpers/auth';
import { postLogout, postRefresh } from '../../api/auth'

dotenv.config();

const request = supertest(process.env.BASE_URL);

describe('POST /auth/logout', () => {
    const customerUsername = 'alice';
    const customerPassword = 'Password1!';
    let access_token_res = '';
    let refresh_token_res = '';
    
    beforeEach(async () => {
        ({ access_token: access_token_res, refresh_token: refresh_token_res } = await getToken(customerUsername, customerPassword));
    });

    it('Successfully logged out', async() => {
        const response = await postLogout({
            "refresh_token": refresh_token_res
        })
        
        expect(response.status).toBe(200);
        expect(response.body.message).toEqual('Logged out successfully.');
    });

    it('Refresh token revoked after logout', async() => {
        const response1 = await postLogout({
            "refresh_token": refresh_token_res
        })
        
        expect(response1.status).toBe(200);
        expect(response1.body.message).toEqual('Logged out successfully.');

        const response2 = await postRefresh({
            "refresh_token": refresh_token_res
        })

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
});