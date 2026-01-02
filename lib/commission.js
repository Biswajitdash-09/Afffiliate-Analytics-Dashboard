import { User, Link, Commission, Analytics } from '@/lib/models';

/**
 * Core logic to calculate and record a commission.
 * Handles: Rate lookup, Commission creation, and Stats updates.
 */
export async function processCommission({ affiliateId, linkId, saleAmount, description, uniqueId }) {
    try {
        // 1. Fetch Entities
        const user = await User.findById(affiliateId);
        // Link is optional (might be a general referral), but usually present
        const link = linkId ? await Link.findById(linkId) : null;

        if (!user) {
            return { success: false, error: 'Affiliate not found' };
        }

        // 2. Determine Rate
        // Priority: Link Override > User Rate > Global Default (10%)
        let rate = 10;
        if (link && link.commissionRate) {
            rate = link.commissionRate;
        } else if (user.commissionRate) {
            rate = user.commissionRate;
        }

        // 3. Calculate Commission
        const commissionAmount = parseFloat((saleAmount * (rate / 100)).toFixed(2));

        // 4. Idempotency Check
        if (uniqueId) {
            const existing = await Commission.findOne({ stripeSessionId: uniqueId });
            if (existing) {
                return { success: true, status: 'skipped_duplicate', commission: existing };
            }
        }

        // 5. Create Record
        const newCommission = await Commission.create({
            affiliateId: user._id,
            linkId: link ? link._id : null,
            amount: commissionAmount,
            saleAmount: saleAmount,
            rateUsed: rate,
            description: description || `Commission for sale (Rate: ${rate}%)`,
            status: 'pending', // Default
            stripeSessionId: uniqueId // Can be generic ID for non-stripe events
        });

        // Send Email Notification
        try {
            const { sendCommissionEmail } = await import('./email.js');
            await sendCommissionEmail(user, commissionAmount, 'Stripe Sale');
        } catch (e) {
            console.error('Email Error:', e);
        }

        // 6. Update Link Stats
        if (link) {
            await Link.findByIdAndUpdate(link._id, {
                $inc: {
                    conversions: 1,
                    revenue: saleAmount
                }
            });
        }

        // 7. Update Analytics (Daily)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await Analytics.findOneAndUpdate(
            {
                date: today,
                linkId: link ? link._id : null,
                affiliateId: user._id
            },
            {
                $inc: {
                    conversions: 1,
                    revenue: saleAmount
                }
            },
            { upsert: true }
        );

        return { success: true, status: 'created', commission: newCommission };

    } catch (error) {
        console.error('Commission Processing Error:', error);
        throw error;
    }
}
