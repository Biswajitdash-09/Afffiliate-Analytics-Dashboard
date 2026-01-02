import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Payout, Commission, User } from '@/lib/models'; // Note: Assuming User balance isn't used as primary ledger, but calculated
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse('Unauthorized', { status: 401 });

        await dbConnect();

        // Query Payouts
        const query = {};
        if (session.user.role !== 'admin') {
            query.affiliateId = session.user.id;
        }

        const payouts = await Payout.find(query)
            .populate('affiliateId', 'name email')
            .sort({ date: -1 });

        // Calculate Available Balance for this user (Balance Logic)
        // Formula: Total Approved Commissions - Total Requested Payouts
        let balance = 0;
        if (session.user.role === 'affiliate') {
            // Aggregating Approved Commissions
            const commissions = await Commission.aggregate([
                { $match: { affiliateId: new mongoose.Types.ObjectId(session.user.id), status: 'approved' } }, // Only approved
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalEarned = commissions[0]?.total || 0;

            // Aggregating All Payouts (Requested/Processing/Completed) - ignoring Rejected
            const requested = await Payout.aggregate([
                { $match: { affiliateId: new mongoose.Types.ObjectId(session.user.id), status: { $ne: 'rejected' } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalWithdrawn = requested[0]?.total || 0;

            balance = totalEarned - totalWithdrawn;
        }

        return NextResponse.json({
            payouts,
            availableBalance: balance
        });

    } catch (error) {
        console.error('Payout API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse('Unauthorized', { status: 401 });

        const body = await request.json();
        const { amount, method } = body;

        if (!amount || amount <= 0) return new NextResponse('Invalid amount', { status: 400 });

        await dbConnect();

        // Balance Check (Re-verify logic)
        const commissions = await Commission.aggregate([
            { $match: { affiliateId: new mongoose.Types.ObjectId(session.user.id), status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalEarned = commissions[0]?.total || 0;

        const requested = await Payout.aggregate([
            { $match: { affiliateId: new mongoose.Types.ObjectId(session.user.id), status: { $ne: 'rejected' } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalWithdrawn = requested[0]?.total || 0;
        const available = totalEarned - totalWithdrawn;

        if (amount > available) {
            return new NextResponse('Insufficient balance', { status: 400 });
        }

        const newPayout = await Payout.create({
            affiliateId: session.user.id,
            amount,
            method: method || 'Bank Transfer',
            status: 'pending',
            date: new Date()
        });

        // Send Notification
        try {
            const { sendPayoutRequestEmail } = await import('@/lib/email');
            await sendPayoutRequestEmail(session.user, amount);
        } catch (emailErr) {
            console.error('Email Error:', emailErr);
        }

        return NextResponse.json(newPayout, { status: 201 });

    } catch (error) {
        console.error('Create Payout Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);
        // Only Admin can update Payout Status
        if (!session || session.user.role !== 'admin') return new NextResponse('Unauthorized', { status: 401 });

        const body = await request.json();
        const { id, status, transactionId } = body;

        await dbConnect();

        const payout = await Payout.findByIdAndUpdate(id, {
            status,
            ...(transactionId && { transactionId })
        }, { new: true });

        if (payout) {
            // Fetch user for email
            const user = await User.findById(payout.affiliateId);
            if (user) {
                try {
                    const { sendPayoutProcessedEmail } = await import('@/lib/email');
                    await sendPayoutProcessedEmail(user, payout.amount, status);
                } catch (emailErr) {
                    console.error('Email Error:', emailErr);
                }
            }
        }

        return NextResponse.json(payout);

    } catch (error) {
        console.error('Update Payout Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
