# Stripe Setup Instructions

## Overview

TechCareer.AI uses Stripe for subscription management with the following features:
- **Pro Plan**: $9.99/month with unlimited CV analyses
- **Free Trial**: 14-day trial period
- **Webhook Integration**: Real-time subscription status updates
- **Secure Checkout**: Hosted Stripe Checkout pages

## 1. Create Stripe Account

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign up for a Stripe account (use test mode for development)
3. Complete account verification

## 2. Get Your Stripe API Keys

1. In your Stripe dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_` for test mode)
3. Copy your **Secret key** (starts with `sk_test_` for test mode)

## 3. Create Subscription Product

1. Go to **Products** in your Stripe dashboard
2. Click **"Create product"**
3. **Product name**: "TechCareer.AI Pro"
4. **Product description**: "Unlock advanced CV analysis, job matching, and career insights"
5. **Pricing model**: "Standard pricing"
6. **Price**: $9.99
7. **Currency**: USD
8. **Billing interval**: Monthly
9. **Add trial period**: 14 days (optional)
10. Click **"Create product"**
11. Copy the **Price ID** (starts with `price_`)

## 4. Set Up Webhooks (Important!)

Stripe webhooks notify your app of subscription changes in real-time.

### Create Webhook Endpoint

1. In Stripe dashboard, go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
   - For local development: Use ngrok or similar tunneling service
   - Example: `https://abc123.ngrok.io/api/webhooks/stripe`
4. **Events to listen for**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Webhook signing secret** (starts with `whsec_`)

## 5. Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here

# Price IDs (add as needed)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
```

## 6. Test the Integration

### Local Development Setup

1. **Install ngrok** (for webhook testing):
   ```bash
   # Install ngrok
   npm install -g ngrok

   # Start tunnel on port 3000
   ngrok http 3000
   ```

2. **Update webhook URL** in Stripe dashboard with your ngrok URL

3. **Start your dev server**:
   ```bash
   npm run dev
   ```

### Testing Subscription Flow

1. **Visit pricing page**: `http://localhost:3000/pricing`
2. **Click "Start Free Trial"** on Pro plan
3. **Fill out test information**:
   - **Email**: Any valid email
   - **Card details**: Use Stripe test card `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., 12/28)
   - **CVC**: Any 3 digits (e.g., 123)
4. **Complete checkout**
5. **Verify success**: You should be redirected to success page
6. **Check subscription**: User should now have Pro access

### Test Webhooks

1. **Simulate webhook events** in Stripe dashboard:
   - Go to **Developers** → **Webhooks**
   - Click on your webhook endpoint
   - Click **"Send test webhook"**
   - Test different events (subscription created, updated, etc.)

2. **Check application logs** for webhook processing

## 7. Production Deployment

### Environment Setup

1. **Switch to live mode** in Stripe dashboard
2. **Get live API keys** (start with `pk_live_` and `sk_live_`)
3. **Create live webhook** endpoint
4. **Update environment variables** with live keys
5. **Test with real payment methods**

### Security Considerations

1. **Webhook signature verification**: Always verify webhook signatures
2. **HTTPS only**: Webhooks must use HTTPS in production
3. **Environment separation**: Never mix test and live credentials
4. **Rate limiting**: Implement rate limiting on webhook endpoints

## 8. Troubleshooting

### Common Issues

**Webhook not firing:**
- Check webhook URL is accessible
- Verify ngrok tunnel is active
- Check Stripe dashboard for webhook errors

**Subscription not activating:**
- Verify webhook secret is correct
- Check application logs for webhook processing errors
- Ensure database is properly updated

**Payment failures:**
- Use valid test card numbers
- Check Stripe dashboard for payment errors
- Verify API keys are correct

### Test Cards

**Successful payments:**
- `4242 4242 4242 4242` (Visa)
- `4000 0025 0000 3155` (Visa with 3D Secure)
- `5555 5555 5555 4444` (Mastercard)

**Failed payments:**
- `4000 0000 0000 0002` (Declined card)

### Logs and Monitoring

```bash
# Check application logs
npm run logs

# Check Stripe dashboard
# - Events log
# - Webhook attempts
# - Subscription status
```

## 9. Subscription Management

### Features Included
- ✅ Monthly recurring billing
- ✅ Free trial period
- ✅ Automatic subscription updates
- ✅ Proration handling
- ✅ Failed payment recovery
- ✅ Subscription cancellation

### Pro Features Unlocked
- Unlimited CV uploads and analysis
- Advanced job matching
- CV metadata management
- Learning blueprint system
- Career guidance features

## 10. Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Webhook Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

For application-specific issues:
- Check application logs
- Verify environment variables
- Test with Stripe's dashboard tools
