import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Analytics, User } from '@/lib/models';
import { subDays, startOfDay } from 'date-fns';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30d';
        const limit = parseInt(searchParams.get('limit') || '10');

        let startDate = new Date(0);
        const now = new Date();

        if (range === '7d') startDate = subDays(now, 7);
        if (range === '30d') startDate = subDays(now, 30);
        if (range === '90d') startDate = subDays(now, 90);

        startDate = startOfDay(startDate);

        // Aggregate performance by affiliate
        const leaderboardData = await Analytics.aggregate([
            {
                $match: {
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$affiliateId',
                    totalRevenue: { $sum: '$revenue' },
                    totalClicks: { $sum: '$clicks' },
                    totalConversions: { $sum: '$conversions' }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    affiliateId: '$_id',
                    name: '$userDetails.name',
                    email: '$userDetails.email',
                    avatar: '$userDetails.avatar',
                    revenue: '$totalRevenue',
                    clicks: '$totalClicks',
                    conversions: '$totalConversions',
                    conversionRate: {
                        $cond: [
                            { $eq: ['$totalClicks', 0] },
                            0,
                            { $multiply: [{ $divide: ['$totalConversions', '$totalClicks'] }, 100] }
                        ]
                    }
                }
            }
        ]);

        // Add rank
        const rankedData = leaderboardData.map((item, index) => ({
            rank: index + 1,
            ...item
        }));

        return NextResponse.json(rankedData);

    } catch (error) {
        console.error('Leaderboard API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
