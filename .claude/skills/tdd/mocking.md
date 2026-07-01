# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

Don't mock:

- Your own classes/modules
- Internal collaborators
- Anything you control

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. Prefer SDK-style interfaces over generic fetchers**

Create specific functions for each external operation instead of one generic function with conditional logic:

```typescript
// GOOD: Each function is independently mockable
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: Mocking requires conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

The SDK approach means:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint

## Career War Context

This project already uses dependency injection for the two external dependencies:

```typescript
// shared/src/engine.ts
interface EngineContext {
  now(): number;
  makeId(): string;
  rollDice(): number;  // 1-6, the only randomness source
}
```

This makes testing straightforward — inject a deterministic `rollDice`:

```typescript
test("gunslinger roll 6 triggers barrage", () => {
  const ctx = { now: () => 0, makeId: () => "id1", rollDice: () => 6 };
  const room = createTestRoom();
  const result = rollForActivePlayer(room, "player1", ctx);
  expect(result.skillTriggered).toBe("barrage");
});
```
