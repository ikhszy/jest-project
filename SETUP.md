# Jest Project — Setup Guides

A step-by-step guide to setting up a Jest integration testing project from scratch,
targeting the local Express + SQLite API.

---

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- The `api_project` server running at `http://localhost:3001`

---

## Step 1 — Initialise the project

Run this inside the `jest-project` folder:

```bash
npm init -y
```

This creates a `package.json` file — the heart of any Node project. It tracks your
project name, version, and most importantly the dependencies you install later.

The `-y` flag just skips the interactive questions and fills in sensible defaults.
You can always edit `package.json` manually afterwards.

---

## Step 2 — Add `"type": "module"` to package.json

Open `package.json` and add this line:

```json
{
  "type": "module"
}
```

This tells Node to treat all `.js` files in the project as ES Modules — meaning you
can use `import`/`export` syntax (same as the API project) instead of the older
`require()` style.

---

## Step 3 — Install Jest and its dependencies

```bash
npm install --save-dev jest @jest/globals
```

```bash
npm install --save-dev supertest
```

```bash
npm install dotenv
```

Why each one:

- **jest** — the test runner itself. It finds your test files, runs them, and reports
  results.
- **@jest/globals** — gives you `describe`, `it`, `expect`, and other Jest functions
  as proper imports instead of relying on globals. Cleaner and more explicit.
- **supertest** — lets you make real HTTP requests to your Express app inside tests
  without the server needing to be manually started. Think of it as Postman, but
  automated and inside your test code.
- **dotenv** — loads environment variables from a `.env` file so your tests can read
  things like the API base URL and JWT secrets.

---

## Step 4 — Install Babel (needed for ESM + Jest)

Jest does not natively support ES Modules yet. Babel acts as a translator — it
converts your modern `import`/`export` syntax into something Jest can understand
before running the tests.

```bash
npm install --save-dev babel-jest @babel/core @babel/preset-env
```

Then create a `babel.config.json` file in the project root:

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": { "node": "current" }
      }
    ]
  ]
}
```

`"targets": { "node": "current" }` tells Babel to only transform what the current
Node version doesn't already understand — keeping the output as close to your
original code as possible.

---

## Step 5 — Configure Jest in package.json

Add a `"jest"` section and a test script to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:verbose": "jest --verbose"
  },
  "jest": {
    "testEnvironment": "node",
    "transform": {
      "^.+\\.js$": "babel-jest"
    }
  }
}
```

What each script does:

- **test** — runs all tests once and exits. Use this in CI or when you just want a
  result.
- **test:watch** — re-runs affected tests every time you save a file. Great while
  actively writing tests.
- **test:verbose** — same as `test` but prints every individual test name instead of
  just a summary. Useful when debugging failures.

---

## Step 6 — Create a `.env` file

Create a `.env` file in the project root:

```
BASE_URL=http://localhost:3001
```

This is where you store configuration that might change between environments (local,
CI, staging). Your tests will read `BASE_URL` from here instead of having it
hardcoded everywhere — so if the API port changes, you update it in one place.

---

## Step 7 — Create the folder structure

```
jest-project/
├── tests/
│   ├── helpers/
│   │   └── auth.js
│   ├── auth.test.js
│   ├── products.test.js
│   ├── cart.test.js
│   └── orders.test.js
├── .env
├── babel.config.json
├── package.json
└── SETUP.md
```

Here is what each folder and file is for:

### `tests/`
All test files live here. Keeping tests in a dedicated folder separates them from
any source code you might add later, and makes it easy to tell Jest where to look.

### `tests/helpers/`
Shared utility functions used across multiple test files. The most important one is
`auth.js` — it handles logging in and returning a token so every test file doesn't
have to repeat the login logic. This is the same idea as a `helpers/` folder in
Playwright or K6.

### `tests/auth.test.js`
Tests for the `/auth` endpoints — register, login, refresh token, logout, and the
`/auth/me` profile route. This is a good first file to write because auth is the
foundation everything else depends on.

### `tests/products.test.js`
Tests for `/products` — listing, filtering, getting a single product, and the
admin-only create/update/delete operations.

### `tests/cart.test.js`
Tests for `/cart` — viewing the cart, adding items, updating quantities, removing
items, and clearing the cart.

### `tests/orders.test.js`
Tests for `/orders` — creating an order from a cart, listing orders, and the
admin-only status update.

---

## Step 8 — Verify the setup

Create a quick sanity-check test at `tests/health.test.js`:

```js
import { describe, it, expect } from '@jest/globals';

describe('Health check', () => {
  it('should confirm Jest is working', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Then run:

```bash
npm test
```

You should see something like:

```
PASS  tests/health.test.js
  Health check
    ✓ should confirm Jest is working (2ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

If you see that — Jest is set up correctly and you're ready to start writing real
tests.

---

## What's next

Once setup is confirmed, the learning path goes like this:

1. **`auth.test.js`** — login, register, token refresh. Gets you comfortable with
   `describe`, `it`, `expect`, and `beforeAll`.
2. **`products.test.js`** — read-only tests first (listing, filtering), then
   admin-protected write operations.
3. **`cart.test.js`** — stateful tests: add → update → remove → clear.
4. **`orders.test.js`** — full checkout flow tied to cart state.
