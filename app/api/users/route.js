import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await dbConnect();

        // Get all affiliates
        const users = await User.find({ role: 'affiliate' }).select('-password').sort({ createdAt: -1 });

        const formattedUsers = users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status || 'active', // Default for legacy
            commissionRate: u.commissionRate || 10,
            createdAt: u.createdAt,
            avatar: u.avatar
        }));

        return NextResponse.json(formattedUsers);

    } catch (error) {
        console.error('User API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
