import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Analytics, User } from '@/lib/models';
import { subDays, startOfDay } from 'date-fns';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30d';
        const affiliateId = searchParams.get('affiliateId');

        let startDate = new Date(0);
        const now = new Date();

        if (range === '7d') startDate = subDays(now, 7);
        if (range === '30d') startDate = subDays(now, 30);
        if (range === '90d') startDate = subDays(now, 90);

        startDate = startOfDay(startDate);

        // Build match stage
        const matchStage = {
            date: { $gte: startDate }
        };

        // Filter by affiliate if not admin, or if specific affiliate requested
        if (session.user.role !== 'admin') {
            matchStage.affiliateId = new mongoose.Types.ObjectId(session.user.id);
        } else if (affiliateId) {
            matchStage.affiliateId = new mongoose.Types.ObjectId(affiliateId);
        }

        // Get funnel totals
        const funnelData = await Analytics.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    clicks: { $sum: '$clicks' },
                    conversions: { $sum: '$conversions' },
                    revenue: { $sum: '$revenue' }
                }
            }
        ]);

        const totals = funnelData[0] || { clicks: 0, conversions: 0, revenue: 0 };

        // Estimate signups (for demo - in production this would come from actual signup tracking)
        // Using a realistic conversion funnel: ~30% of clicks lead to signup, ~10% of signups convert
        const estimatedSignups = Math.round(totals.clicks * 0.3);

        // Get breakdown by affiliate (for admin)
        let affiliateBreakdown = [];
        if (session.user.role === 'admin' && !affiliateId) {
            affiliateBreakdown = await Analytics.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$affiliateId',
                        clicks: { $sum: '$clicks' },
                        conversions: { $sum: '$conversions' },
                        revenue: { $sum: '$revenue' }
                    }
                },
                { $sort: { revenue: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'affiliate'
                    }
                },
                { $unwind: '$affiliate' },
                {
                    $project: {
                        affiliateId: '$_id',
                        name: '$affiliate.name',
                        email: '$affiliate.email',
                        clicks: 1,
                        conversions: 1,
                        revenue: 1,
                        conversionRate: {
                            $cond: [
                                { $eq: ['$clicks', 0] },
                                0,
                                { $multiply: [{ $divide: ['$conversions', '$clicks'] }, 100] }
                            ]
                        }
                    }
                }
            ]);
        }

        // Get breakdown by link/campaign
        const campaignBreakdown = await Analytics.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$linkId',
                    clicks: { $sum: '$clicks' },
                    conversions: { $sum: '$conversions' },
                    revenue: { $sum: '$revenue' }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'links',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'link'
                }
            },
            { $unwind: { path: '$link', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    linkId: '$_id',
                    name: { $ifNull: ['$link.name', 'Unknown Campaign'] },
                    slug: '$link.slug',
                    clicks: 1,
                    conversions: 1,
                    revenue: 1,
                    conversionRate: {
                        $cond: [
                            { $eq: ['$clicks', 0] },
                            0,
                            { $multiply: [{ $divide: ['$conversions', '$clicks'] }, 100] }
                        ]
                    }
                }
            }
        ]);

        return NextResponse.json({
            funnel: {
                clicks: totals.clicks,
                signups: estimatedSignups,
                conversions: totals.conversions,
                revenue: totals.revenue
            },
            affiliateBreakdown,
            campaignBreakdown,
            dateRange: range
        });

    } catch (error) {
        console.error('Funnel API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
