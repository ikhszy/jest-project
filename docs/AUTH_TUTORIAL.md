# Writing Your First Auth Tests with Jest

This tutorial walks you through writing integration tests for the `/auth` endpoints
of the Express + SQLite API. By the end you will have a working `auth.test.js` and
a reusable `helpers/auth.js` utility.

---

## What we're testing

| Method | Route          | Auth      | Body fields                                              | Description               |
|--------|----------------|-----------|----------------------------------------------------------|---------------------------|
| POST   | /auth/register | —         | `username`, `email`, `password`, `first_name`, `last_name` | Register a new user     |
| POST   | /auth/login    | —         | `username`, `password`                                   | Login, receive tokens     |
| POST   | /auth/refresh  | —         | `refresh_token`                                          | Rotate tokens             |
| POST   | /auth/logout   | —         | `refresh_token`                                          | Revoke refresh token      |
| GET    | /auth/me       | ✅ Bearer  | —                                                        | Get current user profile  |

**Login response shape:**
```json
{
  "user": { "id": 1, "username": "alice", "role": "customer" },
  "access_token": "<jwt>",
  "refresh_token": "<jwt>"
}
```

> The API uses an `access_token` / `refresh_token` pair — not a single `token` field.
> Keep this in mind throughout the tutorial.

---

## Seed accounts

These users are already in the database after running `npm run setup` on the API:

| Username | Password    | Role     |
|----------|-------------|----------|
| alice    | Password1!  | customer |
| bob      | Password1!  | customer |
| admin    | Admin1234!  | admin    |

We'll use `alice` for customer tests and `admin` for admin tests.

---

## Prerequisites

- Setup is complete (see `SETUP.md`)
- The API server is running at `http://localhost:3001`
- `npm test` passes on the health check

---

## Step 1 — Create the auth helper

Before writing any tests, create a small helper that handles login and returns both
tokens. This avoids repeating the login logic in every test file.

Open `tests/helpers/auth.js` and add:

```js
import supertest from 'supertest';
import dotenv from 'dotenv';

dotenv.config();

const request = supertest(process.env.BASE_URL);

/**
 * Logs in with the provided credentials and returns both tokens.
 * Throws if login fails so the calling test fails with a clear message.
 *
 * @returns {{ access_token: string, refresh_token: string }}
 */
export async function login(username, password) {
  const response = await request
    .post('/auth/login')
    .send({ username, password });

  if (response.status !== 200) {
    throw new Error(
      `Login failed (${response.status}): ${JSON.stringify(response.body)}`
    );
  }

  return {
    access_token: response.body.access_token,
    refresh_token: response.body.refresh_token,
  };
}
```

### Why return both tokens?

Some tests need the `access_token` to make authenticated requests. Others (refresh,
logout) need the `refresh_token` to send in the request body. Returning both from
one helper keeps the tests clean.

---

## Step 2 — Set up auth.test.js

Open `tests/auth.test.js`. Start with the imports and the supertest instance:

```js
import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';

dotenv.config();

const request = supertest(process.env.BASE_URL);
```

- `describe` / `it` / `expect` — the core Jest building blocks
- `beforeAll` — runs once before all tests in a block, perfect for setup like login
- `supertest(process.env.BASE_URL)` — creates a request agent pointed at the API

---

## Step 3 — Test user registration

Add the first `describe` block for the register endpoint:

```js
describe('POST /auth/register', () => {

  it('should register a new user and return 201', async () => {
    const response = await request
      .post('/auth/register')
      .send({
        username: `testuser_${Date.now()}`, // unique username each run
        email: `test_${Date.now()}@example.com`,
        password: 'Password1!',
        first_name: 'Test',
        last_name: 'User',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
  });

  it('should return 400 if the username is already taken', async () => {
    const user = {
      username: 'duplicateuser',
      email: `dup_${Date.now()}@example.com`,
      password: 'Password1!',
      first_name: 'Dup',
      last_name: 'User',
    };

    // First registration — should succeed
    await request.post('/auth/register').send(user);

    // Second registration with the same username — should fail
    const response = await request.post('/auth/register').send(user);

    expect(response.status).toBe(400);
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request
      .post('/auth/register')
      .send({ email: 'incomplete@example.com' }); // no username or password

    expect(response.status).toBe(400);
  });

});
```

### Key concept: `Date.now()` for unique values

Integration tests run against a real database. If you hardcode a username or email,
the second test run will fail because the user already exists. Appending `Date.now()`
produces a fresh value every time.

---

## Step 4 — Test login

Add a second `describe` block for login:

```js
describe('POST /auth/login', () => {

  it('should return 200 with both tokens on valid credentials', async () => {
    const response = await request
      .post('/auth/login')
      .send({ username: 'alice', password: 'Password1!' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.username).toBe('alice');
  });

  it('should return 401 with a wrong password', async () => {
    const response = await request
      .post('/auth/login')
      .send({ username: 'alice', password: 'wrongpassword' });

    expect(response.status).toBe(401);
  });

  it('should return 401 with an unknown username', async () => {
    const response = await request
      .post('/auth/login')
      .send({ username: 'nobody', password: 'Password1!' });

    expect(response.status).toBe(401);
  });

});
```

---

## Step 5 — Test the /auth/me profile route

This route requires authentication — it's where `beforeAll` and the helper come in.

```js
describe('GET /auth/me', () => {
  let access_token;

  beforeAll(async () => {
    // Log in once before all tests in this describe block
    const { login } = await import('./helpers/auth.js');
    ({ access_token } = await login('alice', 'Password1!'));
  });

  it('should return the user profile when authenticated', async () => {
    const response = await request
      .get('/auth/me')
      .set('Authorization', `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'alice');
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request.get('/auth/me');

    expect(response.status).toBe(401);
  });

  it('should return 401 with an invalid token', async () => {
    const response = await request
      .get('/auth/me')
      .set('Authorization', 'Bearer this.is.not.valid');

    expect(response.status).toBe(401);
  });

});
```

### Key concept: `beforeAll`

`beforeAll` runs once before all the `it` blocks inside the same `describe`. By
declaring `let access_token` outside the `it` blocks, every test in that block
shares it — without logging in repeatedly.

### Key concept: `.set('Authorization', ...)`

This is how supertest attaches a header to a request. The API expects a Bearer
token in the `Authorization` header, just like a real client would send.

---

## Step 6 — Test token refresh

The refresh endpoint expects the `refresh_token` sent **in the request body** — not
as a Bearer header.

```js
describe('POST /auth/refresh', () => {
  let refresh_token;

  beforeAll(async () => {
    const { login } = await import('./helpers/auth.js');
    ({ refresh_token } = await login('alice', 'Password1!'));
  });

  it('should return a new token pair when given a valid refresh token', async () => {
    const response = await request
      .post('/auth/refresh')
      .send({ refresh_token });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
  });

  it('should return 401 with an invalid refresh token', async () => {
    const response = await request
      .post('/auth/refresh')
      .send({ refresh_token: 'not.a.real.token' });

    expect(response.status).toBe(401);
  });

});
```

### Key concept: token rotation

Every call to `/auth/refresh` invalidates the old `refresh_token` and issues a new
pair. This is a security feature — if a refresh token is stolen and used, the
original holder's token stops working immediately.

---

## Step 7 — Test logout

Logout also expects the `refresh_token` in the body, not a Bearer header. After
logout, that refresh token is revoked server-side.

```js
describe('POST /auth/logout', () => {
  let access_token;
  let refresh_token;

  beforeAll(async () => {
    const { login } = await import('./helpers/auth.js');
    ({ access_token, refresh_token } = await login('alice', 'Password1!'));
  });

  it('should return 200 on logout', async () => {
    const response = await request
      .post('/auth/logout')
      .send({ refresh_token });

    expect(response.status).toBe(200);
  });

  it('should reject a refresh attempt with the revoked token', async () => {
    // Logout first
    await request.post('/auth/logout').send({ refresh_token });

    // Try to refresh with the now-revoked token
    const response = await request
      .post('/auth/refresh')
      .send({ refresh_token });

    expect(response.status).toBe(401);
  });

});
```

---

## Step 8 — Run the tests

```bash
npm test -- tests/auth.test.js
```

The `--` passes arguments through to Jest. Running a single file is faster while
writing tests — run `npm test` (all files) once you're confident everything passes.

Expected output:

```
PASS  tests/auth.test.js
  POST /auth/register
    ✓ should register a new user and return 201
    ✓ should return 400 if the username is already taken
    ✓ should return 400 if required fields are missing
  POST /auth/login
    ✓ should return 200 with both tokens on valid credentials
    ✓ should return 401 with a wrong password
    ✓ should return 401 with an unknown username
  GET /auth/me
    ✓ should return the user profile when authenticated
    ✓ should return 401 when no token is provided
    ✓ should return 401 with an invalid token
  POST /auth/refresh
    ✓ should return a new token pair when given a valid refresh token
    ✓ should return 401 with an invalid refresh token
  POST /auth/logout
    ✓ should return 200 on logout
    ✓ should reject a refresh attempt with the revoked token
```

---

## The complete files

### `tests/helpers/auth.js`

```js
import supertest from 'supertest';
import dotenv from 'dotenv';

dotenv.config();

const request = supertest(process.env.BASE_URL);

export async function login(username, password) {
  const response = await request
    .post('/auth/login')
    .send({ username, password });

  if (response.status !== 200) {
    throw new Error(
      `Login failed (${response.status}): ${JSON.stringify(response.body)}`
    );
  }

  return {
    access_token: response.body.access_token,
    refresh_token: response.body.refresh_token,
  };
}
```

### `tests/auth.test.js`

```js
import { describe, it, expect, beforeAll } from '@jest/globals';
import supertest from 'supertest';
import dotenv from 'dotenv';

dotenv.config();

const request = supertest(process.env.BASE_URL);


describe('POST /auth/register', () => {

  it('should register a new user and return 201', async () => {
    const response = await request
      .post('/auth/register')
      .send({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Password1!',
        first_name: 'Test',
        last_name: 'User',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
  });

  it('should return 400 if the username is already taken', async () => {
    const user = {
      username: 'duplicateuser',
      email: `dup_${Date.now()}@example.com`,
      password: 'Password1!',
      first_name: 'Dup',
      last_name: 'User',
    };

    await request.post('/auth/register').send(user);
    const response = await request.post('/auth/register').send(user);

    expect(response.status).toBe(400);
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request
      .post('/auth/register')
      .send({ email: 'incomplete@example.com' });

    expect(response.status).toBe(400);
  });

});


describe('POST /auth/login', () => {

  it('should return 200 with both tokens on valid credentials', async () => {
    const response = await request
      .post('/auth/login')
      .send({ username: 'alice', password: 'Password1!' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.username).toBe('alice');
  });

  it('should return 401 with a wrong password', async () => {
    const response = await request
      .post('/auth/login')
      .send({ username: 'alice', password: 'wrongpassword' });

    expect(response.status).toBe(401);
  });

  it('should return 401 with an unknown username', async () => {
    const response = await request
      .post('/auth/login')
      .send({ username: 'nobody', password: 'Password1!' });

    expect(response.status).toBe(401);
  });

});


describe('GET /auth/me', () => {
  let access_token;

  beforeAll(async () => {
    const { login } = await import('./helpers/auth.js');
    ({ access_token } = await login('alice', 'Password1!'));
  });

  it('should return the user profile when authenticated', async () => {
    const response = await request
      .get('/auth/me')
      .set('Authorization', `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'alice');
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request.get('/auth/me');
    expect(response.status).toBe(401);
  });

  it('should return 401 with an invalid token', async () => {
    const response = await request
      .get('/auth/me')
      .set('Authorization', 'Bearer this.is.not.valid');

    expect(response.status).toBe(401);
  });

});


describe('POST /auth/refresh', () => {
  let refresh_token;

  beforeAll(async () => {
    const { login } = await import('./helpers/auth.js');
    ({ refresh_token } = await login('alice', 'Password1!'));
  });

  it('should return a new token pair when given a valid refresh token', async () => {
    const response = await request
      .post('/auth/refresh')
      .send({ refresh_token });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
  });

  it('should return 401 with an invalid refresh token', async () => {
    const response = await request
      .post('/auth/refresh')
      .send({ refresh_token: 'not.a.real.token' });

    expect(response.status).toBe(401);
  });

});


describe('POST /auth/logout', () => {
  let access_token;
  let refresh_token;

  beforeAll(async () => {
    const { login } = await import('./helpers/auth.js');
    ({ access_token, refresh_token } = await login('alice', 'Password1!'));
  });

  it('should return 200 on logout', async () => {
    const response = await request
      .post('/auth/logout')
      .send({ refresh_token });

    expect(response.status).toBe(200);
  });

  it('should reject a refresh attempt with the revoked token', async () => {
    await request.post('/auth/logout').send({ refresh_token });

    const response = await request
      .post('/auth/refresh')
      .send({ refresh_token });

    expect(response.status).toBe(401);
  });

});
```

---

## Concepts recap

| Concept | What it does |
|---|---|
| `describe` | Groups related tests together under a label |
| `it` | A single test case — should make one clear assertion |
| `expect` | Makes an assertion about a value |
| `beforeAll` | Runs once before all tests in a `describe` block |
| `supertest` | Makes real HTTP requests to the API |
| `.set()` | Attaches a header to the request |
| `.send()` | Attaches a JSON body to the request |
| `toHaveProperty` | Checks a key (and optionally a value) exists on the response body |
| `toBe` | Strict equality check — same as `===` |
