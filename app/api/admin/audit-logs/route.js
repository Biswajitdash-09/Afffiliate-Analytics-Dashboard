import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { AuditLog } from '@/lib/models';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const action = searchParams.get('action');
        const targetType = searchParams.get('targetType');

        // Build query
        const query = {};
        if (action) query.action = { $regex: action, $options: 'i' };
        if (targetType) query.targetType = targetType;

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('adminId', 'name email')
            .lean();

        // Format for frontend
        const formattedLogs = logs.map(log => ({
            _id: log._id,
            action: log.action,
            targetId: log.targetId,
            targetType: log.targetType,
            details: log.details,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt,
            admin: log.adminId ? {
                name: log.adminId.name,
                email: log.adminId.email
            } : null
        }));

        return NextResponse.json(formattedLogs);

    } catch (error) {
        console.error('Audit Logs API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
