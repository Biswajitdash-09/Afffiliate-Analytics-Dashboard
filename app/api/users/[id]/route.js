import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { User, AuditLog } from '@/lib/models';

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

        // Get current user state for audit log
        const currentUser = await User.findById(id);
        if (!currentUser) {
            return new NextResponse('User not found', { status: 404 });
        }

        const updateData = {};
        const changes = {};

        if (status && status !== currentUser.status) {
            updateData.status = status;
            changes.status = { from: currentUser.status, to: status };
        }
        if (commissionRate !== undefined && commissionRate !== currentUser.commissionRate) {
            updateData.commissionRate = commissionRate;
            changes.commissionRate = { from: currentUser.commissionRate, to: commissionRate };
        }

        // Only update if there are changes
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({
                id: currentUser._id,
                status: currentUser.status,
                commissionRate: currentUser.commissionRate
            });
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

        // Create audit log entry
        const action = status
            ? (status === 'active' ? 'AFFILIATE_APPROVED' :
                status === 'inactive' ? 'AFFILIATE_REJECTED' :
                    status === 'suspended' ? 'AFFILIATE_SUSPENDED' : 'AFFILIATE_STATUS_CHANGED')
            : 'AFFILIATE_COMMISSION_UPDATED';

        await AuditLog.create({
            adminId: session.user.id,
            action,
            targetId: id,
            targetType: 'User',
            details: {
                affiliateName: currentUser.name,
                affiliateEmail: currentUser.email,
                changes
            },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });

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

