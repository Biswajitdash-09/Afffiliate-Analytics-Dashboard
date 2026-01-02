import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Analytics } from '@/lib/models';
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

        let startDate = new Date(0);
        const now = new Date();

        if (range === '7d') startDate = subDays(now, 7);
        if (range === '30d') startDate = subDays(now, 30);
        if (range === '90d') startDate = subDays(now, 90);

        // Normalize to start of day
        startDate = startOfDay(startDate);

        // Build Match Stage
        const matchStage = {
            date: { $gte: startDate }
        };

        // If affiliate, restricting data to their ID only
        if (session.user.role !== 'admin') {
            matchStage.affiliateId = new mongoose.Types.ObjectId(session.user.id);
        }

        // 1. Get Totals
        const totalsData = await Analytics.aggregate([
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

        const totals = totalsData[0] || { clicks: 0, conversions: 0, revenue: 0 };

        // 2. Get Chart Data (Group by Date)
        const chartData = await Analytics.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    clicks: { $sum: '$clicks' },
                    conversions: { $sum: '$conversions' },
                    revenue: { $sum: '$revenue' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill missing dates? (Optional polish, skipping for MVP API)

        // 3. Get Top Links
        const topLinksData = await Analytics.aggregate([
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
            { $limit: 5 },
            {
                $lookup: {
                    from: 'links',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'linkDetails'
                }
            },
            { $unwind: '$linkDetails' },
            {
                $project: {
                    id: '$_id',
                    name: '$linkDetails.name',
                    clicks: 1,
                    conversions: 1,
                    revenue: 1
                }
            }
        ]);

        return NextResponse.json({
            summary: totals,
            chart: chartData,
            topLinks: topLinksData
        });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
