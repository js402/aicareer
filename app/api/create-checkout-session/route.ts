import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { withAuth } from '@/lib/api-middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
})

export const POST = withAuth(async (req, { user }) => {
    try {
        const { priceId, redirectUrl } = await req.json()

        // Validate redirectUrl to be relative or same origin
        let successPath = '/career-guidance'
        if (redirectUrl && (redirectUrl.startsWith('/') || redirectUrl.startsWith(req.headers.get('origin') || ''))) {
            // If absolute URL, strip origin to get path, or use as is if relative
            const origin = req.headers.get('origin') || ''
            successPath = redirectUrl.replace(origin, '')
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.get('origin')}${successPath}${successPath.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/checkout/cancel`,
            client_reference_id: user.id,
            metadata: {
                userId: user.id,
                plan: 'pro',
            },
        })

        return NextResponse.json({
            sessionId: session.id,
            sessionUrl: session.url
        })
    } catch (error) {
        console.error('Error creating checkout session:', error)
        return NextResponse.json(
            { error: 'Error creating checkout session' },
            { status: 500 }
        )
    }
})
