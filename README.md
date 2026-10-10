# Jest API Testing — Learning Project

A hands-on project for learning API integration testing with **Jest** and **Supertest**. Tests are written against a locally running [Sample store API](https://github.com/ikhszy/sample-store-API).

The goal is to build practical testing skills with a view towards working in professional environments — covering real patterns like API model separation, test data management, and clean test structure.

---

## What This Project Covers

- Writing integration tests with Jest and Supertest
- Structuring tests by endpoint and HTTP method
- Separating API model layer from test files (similar to Playwright's page object model)
- Using `beforeAll` / `beforeEach` for test setup
- Managing test data with Faker
- Handling authentication tokens across tests
- Identifying and documenting API bugs found during testing

---

## Project Structure

```
jest-project/
├── api/                        # API model layer (request functions)
│   ├── auth.js
│   └── products.js
│
├── tests/
│   ├── auth/                   # Auth endpoint tests (split by route)
│   │   ├── register.test.js
│   │   ├── login.test.js
│   │   ├── me.test.js
│   │   ├── refresh.test.js
│   │   └── logout.test.js
│   │
│   ├── products/               # Product endpoint tests (split by method)
│   │   ├── getProducts.test.js
│   │   ├── postProducts.test.js
│   │   ├── patchProducts.test.js
│   │   ├── putProducts.test.js
│   │   └── deleteProducts.test.js
│   │
│   ├── regression/             # Consolidated regression test files
│   │   ├── auth.test.js
│   │   └── products.test.js
│   │
│   ├── helpers/                # Reusable utilities
│   │   ├── auth.js             # getToken() helper
│   │   └── products.js         # createProductData() helper
│   │
│   ├── cart.test.js            # Cart tests (in progress)
│   └── orders.test.js          # Order tests (in progress)
│
└── docs/                       # Test case planning docs
    ├── AUTH_TUTORIAL.md        # Step-by-step guide to writing auth tests
    ├── PRODUCT_CASES.md        # Planned test cases for products
    ├── CART_CASES.md           # Planned test cases for cart
    └── ORDER_CASES.md          # Planned test cases for orders
```

---

## Status

| Area     | Status        |
|----------|---------------|
| Auth     | ✅ Complete   |
| Products | ✅ Complete   |
| Cart     | 🔄 In progress |
| Orders   | 🔄 In progress |

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd jest-project
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set `BASE_URL` to your running API:

```
BASE_URL=http://localhost:3001
```

### 3. Start the API

This project tests against a separate Express + SQLite API. Clone and start it before running tests:

```bash
cd api_project
npm run setup   # create schema + seed data
npm run dev     # start server on port 3001
```

Seed accounts available out of the box:

| Username | Password   | Role     |
|----------|------------|----------|
| alice    | Password1! | customer |
| bob      | Password1! | customer |
| carol    | Password1! | customer |
| dave     | Password1! | customer |
| admin    | Admin1234! | admin    |

---

## Running Tests

```bash
# Run all tests
npm test

# Run a specific folder
npm test -- tests/auth

# Run a specific file
npm test -- tests/products/getProducts.test.js

# Run a specific test by name
npm test -- -t "should return 200"

# Run without watch mode
npm test -- --watchAll=false
```

---

## Known API Bugs

These were discovered during testing and are documented here for reference:

| Endpoint | Issue |
|---|---|
| `POST /auth/refresh` | Token rotation not working — a rotated refresh token can still be used to get new tokens |
| `POST /auth/logout` | No error returned when `refresh_token` field is missing from body |

---

## Dependencies

| Package | Purpose |
|---|---|
| `jest` | Test runner |
| `supertest` | HTTP assertions |
| `@jest/globals` | Explicit Jest API imports |
| `babel-jest` | ES module support |
| `@faker-js/faker` | Random test data generation |
| `dotenv` | Environment variable management |
