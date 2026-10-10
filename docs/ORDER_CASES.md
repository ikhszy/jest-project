# Order Test Cases

## GET /orders

- ✅ customer sees only their own orders → 200 + pagination shape
- ✅ admin sees all orders → 200
- ✅ filter by `status` — all returned orders match the status
- ✅ pagination with `page` and `limit` — returns correct number of items
- ❌ no token → 401

---

## GET /orders/:id

- ✅ customer can view their own order → 200 + order with items
- ❌ customer cannot view another user's order → 403
- ❌ admin can view any order → 200
- ❌ non-existent id → 404
- ❌ no token → 401

---

## POST /orders

- ✅ creates order from cart → 201 + order with items + cart is cleared
- ✅ stock is decremented after checkout
- ❌ missing `street` → 400
- ❌ missing `city` → 400
- ❌ missing `state` → 400
- ❌ missing `zip` → 400
- ❌ empty cart (no items) → 400
- ❌ insufficient stock for a cart item → 409
- ❌ no token → 401

---

## PATCH /orders/:id/status

- ✅ admin updates order status → 200 + updated order
- ✅ each valid status works: `pending`, `processing`, `shipped`, `delivered`, `cancelled`
- ❌ invalid status value → 400
- ❌ missing status field → 400
- ❌ non-existent order id → 404
- ❌ customer token → 403
- ❌ no token → 401

---

## DELETE /orders/:id

- ✅ admin deletes an order → 200
- ✅ deleted order is no longer accessible → 404 on GET
- ❌ non-existent id → 404
- ❌ customer token → 403
- ❌ no token → 401

---

## Notes

- All order endpoints require a Bearer token
- Use `alice` / `Password1!` for customer tests, `bob` / `Password1!` for the cross-user 403 test, `admin` / `Admin1234!` for admin tests
- `POST /orders` requires the cart to have items — in `beforeAll`, add a product to the cart first, then checkout
- After `POST /orders` the cart is cleared automatically — no manual cleanup needed
- For DELETE tests, create a fresh order in `beforeAll` so you're not depending on seeded data
- Valid order statuses: `pending` → `processing` → `shipped` → `delivered` | `cancelled`
