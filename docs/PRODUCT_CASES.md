# Product Test Cases

## GET /products

- ✅ returns a list of products with pagination shape (`data`, `pagination`)
- ✅ filter by `category` — all returned products match the category
- ✅ filter by `search` — all returned products match name or description
- ✅ filter by `minPrice` — all returned products have price ≥ minPrice
- ✅ filter by `maxPrice` — all returned products have price ≤ maxPrice
- ✅ filter by price range (`minPrice` + `maxPrice`) — all products within bounds
- ✅ sort by price ascending — prices are in ascending order
- ✅ sort by price descending — prices are in descending order
- ✅ pagination with `page` and `limit` — returns correct number of items
- ✅ out-of-range page — returns empty `data` array

---

## GET /products/:id

- ✅ returns a single product with correct fields
- ❌ non-existent id → 404 

---

## POST /products

- ✅ admin creates a product → 201 + product object
- ❌ missing `name` → 400
- ❌ missing `category` → 400
- ❌ missing `price` → 400
- ❌ no token → 401
- ❌ customer token → 403

---

## PATCH /products/:id

- ✅ admin partially updates a product — only sent fields are changed
- ❌ empty body (no updatable fields) → 400
- ❌ non-existent id → 404
- ❌ customer token → 403

---

## PUT /products/:id

- ✅ admin fully replaces a product — all fields updated
- ❌ non-existent id → 404
- ❌ customer token → 403

---

## DELETE /products/:id

- ✅ admin deletes a product → 200
- ✅ deleted product is no longer accessible → 404 on GET
- ❌ non-existent id → 404
- ❌ customer token → 403

---

## Notes

- Use `admin` / `Admin1234!` for admin-only endpoints
- Use `alice` / `Password1!` for customer token tests
- For write tests (POST, PATCH, PUT, DELETE), create a fresh product in `beforeAll` using the admin token so tests don't depend on seeded data
- Use `Date.now()` in product names to avoid duplicates across runs
