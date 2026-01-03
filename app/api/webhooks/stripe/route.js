import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import { User, Link, Commission, Analytics, AuditLog } from '@/lib/models';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Handle refund - reverse the commission associated with a charge
 */
async function handleRefund(charge, refundAmount, reason = 'refund') {
    await dbConnect();

    // Find commission by stripeChargeId or by matching session
    let commission = await Commission.findOne({ stripeChargeId: charge.id });

    // If not found by charge, try to find by payment_intent in session lookup
    if (!commission && charge.payment_intent) {
        // Try to find by stripeSessionId containing similar transaction info
        commission = await Commission.findOne({
            stripeSessionId: { $regex: charge.payment_intent, $options: 'i' }
        });
    }

    if (!commission) {
        console.log(`No commission found for charge ${charge.id}, skipping refund handling`);
        return { success: false, reason: 'commission_not_found' };
    }

    // Skip if already reversed
    if (commission.status === 'reversed') {
        console.log(`Commission ${commission._id} already reversed, skipping`);
        return { success: true, status: 'already_reversed' };
    }

    // Calculate refund proportion
    const originalAmount = charge.amount / 100; // Convert from cents
    const refundProportion = refundAmount / originalAmount;
    const commissionToReverse = commission.amount * refundProportion;

    // Update commission status
    await Commission.findByIdAndUpdate(commission._id, {
        status: 'reversed',
        reversedAt: new Date(),
        reverseReason: reason,
        reverseAmount: commissionToReverse
    });

    // Update Analytics - subtract the refunded revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Analytics.findOneAndUpdate(
        {
            date: today,
            linkId: commission.linkId,
            affiliateId: commission.affiliateId
        },
        {
            $inc: {
                revenue: -refundAmount,
                conversions: refundProportion >= 1 ? -1 : 0 // Only decrement if full refund
            }
        }
    );

    // Update Link stats
    if (commission.linkId) {
        await Link.findByIdAndUpdate(commission.linkId, {
            $inc: {
                revenue: -refundAmount,
                conversions: refundProportion >= 1 ? -1 : 0
            }
        });
    }

    // Create audit log
    await AuditLog.create({
        action: `COMMISSION_REVERSED_${reason.toUpperCase()}`,
        targetId: commission._id,
        targetType: 'Commission',
        details: {
            originalAmount: commission.amount,
            reversedAmount: commissionToReverse,
            chargeId: charge.id,
            refundProportion
        }
    });

    console.log(`Reversed commission ${commission._id} due to ${reason}: $${commissionToReverse.toFixed(2)}`);

    return { success: true, commissionId: commission._id, reversedAmount: commissionToReverse };
}

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

        await dbConnect();

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;

                // Extract Affiliate Meta
                const affiliateId = session.metadata?.affiliate_id;
                const linkId = session.metadata?.link_id;

                if (affiliateId && linkId) {
                    // Use shared helper for commission logic
                    const { processCommission } = await import('@/lib/commission');

                    const result = await processCommission({
                        affiliateId,
                        linkId,
                        saleAmount: session.amount_total / 100,
                        description: `Commission for sale via Stripe (Session: ${session.id})`,
                        uniqueId: session.id,
                        chargeId: session.payment_intent // Store for refund lookups
                    });

                    // If commission was created, update it with chargeId for refund tracking
                    if (result.success && result.commission && session.payment_intent) {
                        await Commission.findByIdAndUpdate(result.commission._id, {
                            stripeChargeId: session.payment_intent
                        });
                    }

                    console.log(`Processed commission for session ${session.id}`);
                }
                break;
            }

            case 'charge.refunded': {
                const charge = event.data.object;
                const refundAmount = charge.amount_refunded / 100; // Convert cents to dollars

                console.log(`Processing refund for charge ${charge.id}: $${refundAmount}`);

                await handleRefund(charge, refundAmount, 'refund');
                break;
            }

            case 'charge.dispute.created': {
                const dispute = event.data.object;
                const charge = await stripe.charges.retrieve(dispute.charge);

                console.log(`Processing dispute for charge ${dispute.charge}`);

                await handleRefund(charge, dispute.amount / 100, 'dispute');

                // Additional: Create alert for admin
                await AuditLog.create({
                    action: 'DISPUTE_RECEIVED',
                    targetType: 'Commission',
                    details: {
                        disputeId: dispute.id,
                        chargeId: dispute.charge,
                        amount: dispute.amount / 100,
                        reason: dispute.reason
                    }
                });
                break;
            }

            case 'charge.dispute.closed': {
                const dispute = event.data.object;

                // If dispute was won, we could potentially restore the commission
                // For now, just log it
                await AuditLog.create({
                    action: `DISPUTE_CLOSED_${dispute.status.toUpperCase()}`,
                    targetType: 'Commission',
                    details: {
                        disputeId: dispute.id,
                        chargeId: dispute.charge,
                        status: dispute.status
                    }
                });

                console.log(`Dispute ${dispute.id} closed with status: ${dispute.status}`);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new NextResponse('Webhook Handler Success', { status: 200 });

    } catch (error) {
        console.error('Webhook execution error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
