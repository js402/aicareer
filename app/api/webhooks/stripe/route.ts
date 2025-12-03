import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { upsertSubscription, updateSubscriptionStatus, type SubscriptionStatus } from '@/lib/subscription'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
})

// Create Supabase client with service role for webhook operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
        return NextResponse.json(
            { error: 'No signature provided' },
            { status: 400 }
        )
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json(
            { error: 'Webhook signature verification failed' },
            { status: 400 }
        )
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session

                // Get the subscription from the session
                if (session.subscription && session.metadata?.userId) {
                    const subscription = await stripe.subscriptions.retrieve(
                        session.subscription as string
                    )

                    const stripeSubscription = subscription as unknown as {
                        id: string
                        status: string
                        current_period_start: number
                        current_period_end: number
                        cancel_at_period_end: boolean
                    }

                    await upsertSubscription(supabase, {
                        user_id: session.metadata.userId,
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: stripeSubscription.id,
                        status: stripeSubscription.status as SubscriptionStatus,
                        plan: 'pro',
                        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                    })

                    console.log('Subscription created:', subscription.id)
                }
                break
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription
                const stripeSubscription = subscription as unknown as {
                    id: string
                    status: string
                    current_period_start: number
                    current_period_end: number
                    cancel_at_period_end: boolean
                }

                await updateSubscriptionStatus(
                    supabase,
                    stripeSubscription.id,
                    stripeSubscription.status as SubscriptionStatus,
                    {
                        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                    }
                )

                console.log('Subscription updated:', stripeSubscription.id)
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription

                await updateSubscriptionStatus(
                    supabase,
                    subscription.id,
                    'canceled'
                )

                console.log('Subscription canceled:', subscription.id)
                break
            }

            default:
                console.log('Unhandled event type:', event.type)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Error processing webhook:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}
