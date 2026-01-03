import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { User, Analytics, Payout } from '@/lib/models';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await dbConnect();

        // Get affiliate counts
        const totalAffiliates = await User.countDocuments({ role: 'affiliate' });
        const activeAffiliates = await User.countDocuments({ role: 'affiliate', status: 'active' });
        const pendingAffiliates = await User.countDocuments({ role: 'affiliate', status: 'pending' });

        // Get total revenue from Analytics
        const revenueData = await Analytics.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$revenue' }
                }
            }
        ]);
        const totalRevenue = revenueData[0]?.totalRevenue || 0;

        // Get pending payouts
        const pendingPayoutsData = await Payout.aggregate([
            { $match: { status: 'processing' } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const pendingPayouts = pendingPayoutsData[0]?.total || 0;

        // Get total payouts completed this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyPayoutsData = await Payout.aggregate([
            {
                $match: {
                    status: 'completed',
                    date: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const monthlyPayouts = monthlyPayoutsData[0]?.total || 0;

        return NextResponse.json({
            totalAffiliates,
            activeAffiliates,
            pendingAffiliates,
            totalRevenue,
            pendingPayouts,
            monthlyPayouts
        });

    } catch (error) {
        console.error('Admin Stats API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
