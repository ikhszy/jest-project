import supertest from "supertest";
import dotenv from 'dotenv';

dotenv.config();
const request = supertest(process.env.BASE_URL);

export async function getToken(uname, upass) {
    const response = await request.post('/auth/login')
    .send({ 
        username: uname,
        password: upass
    });

    if(response.status !== 200) {
        throw new Error(
            `Login failed(${response.status}): ${JSON.stringify(response.body)}`
        );
    }

    return {
        access_token: response.body.access_token,
        refresh_token: response.body.refresh_token
    };
}

export async function normalLogin(uname, upass) {
    return await request.post('/auth/login')
        .send({ 
            username: uname,
            password: upass
        });
}