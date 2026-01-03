
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ClickEvent, Link, User } from '@/lib/models';
import { auth } from "@/auth";

export async function GET(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await dbConnect();

        // 1. Get recent suspicious clicks
        const suspiciousClicks = await ClickEvent.find({
            $or: [{ isBot: true }, { fraudScore: { $gt: 0 } }]
        })
            .sort({ timestamp: -1 })
            .limit(50)
            .populate('affiliateId', 'name email')
            .populate('linkId', 'name slug');

        // 2. Aggregate fraud stats by affiliate
        const fraudStats = await ClickEvent.aggregate([
            {
                $match: {
                    $or: [{ isBot: true }, { fraudScore: { $gt: 0 } }]
                }
            },
            {
                $group: {
                    _id: '$affiliateId',
                    suspiciousClicks: { $sum: 1 },
                    avgFraudScore: { $avg: '$fraudScore' },
                    lastSuspiciousActivity: { $max: '$timestamp' }
                }
            },
            { $sort: { suspiciousClicks: -1 } },
            { $limit: 10 }
        ]);

        // Populate affiliate details for aggregated stats
        const populatedStats = await User.populate(fraudStats, { path: '_id', select: 'name email' });

        return NextResponse.json({
            recentClicks: suspiciousClicks,
            topOffenders: populatedStats.map(stat => ({
                affiliate: stat._id,
                suspiciousClicks: stat.suspiciousClicks,
                avgFraudScore: Math.round(stat.avgFraudScore),
                lastActivity: stat.lastSuspiciousActivity
            }))
        });

    } catch (error) {
        console.error('Fraud Stats Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
