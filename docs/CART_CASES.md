# Cart Test Cases

## GET /cart

- ✅ returns the cart for authenticated user (auto-created on first access)
- ❌ no token → 401

---

## POST /cart/items

- ✅ add a product to cart → 200 + updated cart
- ✅ add the same product again → quantity increases
- ❌ missing `product_id` → 400
- ❌ missing `quantity` → 400
- ❌ non-existent `product_id` → 404
- ❌ no token → 401

---

## PATCH /cart/items/:productId

- ✅ update quantity of an existing cart item → 200 + updated cart
- ✅ set quantity to 0 → item is removed from cart
- ❌ non-existent `productId` in cart → 404
- ❌ no token → 401

---

## DELETE /cart/items/:productId

- ✅ remove a single item from cart → 200
- ✅ item is no longer in cart after deletion
- ❌ non-existent `productId` in cart → 404
- ❌ no token → 401

---

## DELETE /cart

- ✅ clear entire cart → 200
- ✅ cart is empty after clearing
- ❌ no token → 401

---

## Notes

- All cart endpoints require a Bearer token — use `alice` / `Password1!`
- Use a `beforeAll` to add a known product to the cart before PATCH and DELETE tests
- For the "clear cart" test, add at least one item first so you can verify it's actually cleared
- Use `DELETE /cart` in an `afterAll` or at the start of `beforeAll` to reset cart state between describe blocks, otherwise leftover items from previous tests can cause unexpected results
- Each user has their own cart — tests for one user won't affect another
