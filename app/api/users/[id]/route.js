import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';

export async function PUT(request, props) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = params;
        const body = await request.json();
        const { status, commissionRate } = body;

        await dbConnect();

        const updateData = {};
        if (status) updateData.status = status;
        if (commissionRate !== undefined) updateData.commissionRate = commissionRate;

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedUser) {
            return new NextResponse('User not found', { status: 404 });
        }

        return NextResponse.json({
            id: updatedUser._id,
            status: updatedUser.status,
            commissionRate: updatedUser.commissionRate
        });

    } catch (error) {
        console.error('Update User Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
