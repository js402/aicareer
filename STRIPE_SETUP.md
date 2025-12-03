# Stripe Setup Instructions

## 1. Get Your Stripe API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

## 2. Create a Product and Price in Stripe

1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Name: "Pro Plan"
4. Description: "Monthly subscription for unlimited CV analyses"
5. Pricing model: "Recurring"
6. Price: $9.99
7. Billing period: Monthly
8. Click "Save product"
9. Copy the **Price ID** (starts with `price_`)

## 3. Add Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PRICE_ID=price_your_price_id_here
```

## 4. Restart Your Dev Server

```bash
npm run dev
```

## 5. Test the Integration

1. Go to http://localhost:3000/pricing
2. Click "Start Free Trial" on the Pro plan
3. Click "Continue to Payment"
4. You'll be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
6. Any future expiry date, any CVC
7. Complete the payment

You should be redirected to the success page!
