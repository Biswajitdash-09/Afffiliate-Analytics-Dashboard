import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import { User, Link, Commission, Analytics } from '@/lib/models';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
    try {
        const body = await req.text();
        // Next.js 15: headers() is async
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!webhookSecret || !signature) {
            console.error('Missing Stripe secret or signature');
            return new NextResponse('Webhook Error: Missing secret/signature', { status: 400 });
        }

        let event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            // 1. Extract Affiliate Meta
            const affiliateId = session.metadata?.affiliate_id;
            const linkId = session.metadata?.link_id;

            if (affiliateId && linkId) {
                await dbConnect();

                // Use shared helper for commission logic
                const { processCommission } = await import('@/lib/commission');

                await processCommission({
                    affiliateId,
                    linkId,
                    saleAmount: session.amount_total / 100,
                    description: `Commission for sale via Stripe (Session: ${session.id})`,
                    uniqueId: session.id
                });

                console.log(`Processed commission for session ${session.id}`);
            }
        }

        return new NextResponse('Webhook Handler Success', { status: 200 });

    } catch (error) {
        console.error('Webhook execution error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
