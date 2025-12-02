# Subscription update behavior with Stripe

When a subscription that was originally created through Stripe checkout is edited (via the dashboard or API), the update flow now attempts to keep the Stripe subscription in sync before saving the local record:

- If the subscription has a `stripeSubscriptionId`, the API calls `updateStripeSubscriptionItems` to replace all Stripe subscription items with the newly submitted service list. The request uses `proration_behavior=always_invoice`, so Stripe will generate an invoice for any price differences immediately and continue the updated pricing going forward.
- The Stripe update is best-effort; if the Stripe call fails, the API returns a 502 error and nothing is persisted locally. This prevents saving a local change that is out of sync with billing.
- After Stripe succeeds (or when there is no `stripeSubscriptionId`, such as manual records), the API saves the new plan, services, address, and totals, then triggers the standard subscription update email.

Configuration note: because Stripe requires an existing product when updating subscription items, set `STRIPE_PRODUCT_ID` in your environment to the product you want all inline prices attached to. The update API will reject requests if this value is missing to avoid silent Stripe failures.

This means end users who edit an active Stripe-backed subscription will see billing changes reflected on their Stripe subscription right away, including proration invoices, while purely local subscriptions continue to behave as before.
