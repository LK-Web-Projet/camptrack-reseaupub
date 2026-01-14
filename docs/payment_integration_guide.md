# Payment Integration Guide

This guide outlines how to integrate third-party payment gateways (like Stripe, PayPal, or Adyen) with the Camptrack application, which currently processes payments manually.

## Overview

The application currently uses a manual status update system where administrators confirm payments. Integrating a payment gateway involves automating this by listening to webhooks from the provider.

## Recommended Providers

### 1. Stripe (Recommended for ease of use)
-   **API**: [Stripe API Reference](https://stripe.com/docs/api)
-   **Key Concepts**: `PaymentIntent`, `Webhooks`.

### 2. PayPal
-   **API**: [PayPal REST API](https://developer.paypal.com/api/rest/)
-   **Key Concepts**: `Orders`, `Captures`, `Webhooks`.

### 3. Adyen
-   **API**: [Adyen Checkout API](https://docs.adyen.com/online-payments)
-   **Key Concepts**: `Sessions`, `Notifications`.

## Integration Steps

### Step 1: Frontend Checkout
Instead of manually creating a payment, you would redirect the user to a checkout page or mount a payment element.

**Example (Stripe):**
1.  Call backend to create a `PaymentIntent`.
2.  Use `stripe.confirmPayment()` on the frontend.

### Step 2: Backend Webhook Handler
You must trigger the manual status update logic automatically when a "success" event is received.

**Endpoint to Create**: `POST /api/webhooks/stripe` (or `/paypal`, etc.)

**Events to Listen For**:
-   **Stripe**: `payment_intent.succeeded`
-   **PayPal**: `CHECKOUT.ORDER.APPROVED` or `PAYMENT.CAPTURE.COMPLETED`
-   **Adyen**: `AUTHORISATION` (with `success: true`)

### Step 3: Updating Application State
When the webhook confirms success:
1.  Verify the signature (security critical!).
2.  Extract metadata (e.g., `id_campagne`, `id_prestataire`) stored in the payment intent.
3.  Query the database for the corresponding `PaiementPrestataire`.
4.  Update the record similarly to the manual PUT endpoint:
    ```typescript
    await prisma.paiementPrestataire.update({
      where: { ... },
      data: {
        statut_paiement: true,
        date_paiement: new Date(),
        transaction_id: event.data.id // Store the provider's ID if you add this field
      }
    });
    ```

## Data Model Considerations
Currently, the database stores:
-   `paiement_base`
-   `sanction_montant`
-   `paiement_final`

When integrating a gateway, ensure the amount charged matches `paiement_final`.

## Testing
-   Use provider sandboxes (e.g., Stripe Test Mode).
-   Use tools like **ngrok** to test webhooks locally.
