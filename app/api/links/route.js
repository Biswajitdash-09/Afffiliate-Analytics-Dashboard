import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from '@/lib/mongodb';
import { Link, User } from '@/lib/models';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse('Unauthorized', { status: 401 });

        await dbConnect();

        // Filter by role
        const query = {};
        if (session.user.role !== 'admin') {
            query.affiliateId = session.user.id;
        }

        const links = await Link.find(query).sort({ createdAt: -1 });

        // Transform if needed (or return direct)
        const formattedLinks = links.map(link => ({
            id: link._id,
            name: link.name,
            slug: link.slug,
            url: link.url,
            affiliateId: link.affiliateId,
            status: link.status,
            createdAt: link.createdAt,

            // Lifetime Stats stored in Link document
            clicks: link.clicks || 0,
            conversions: link.conversions || 0,
            revenue: link.revenue || 0,
            commissionRate: link.commissionRate
        }));

        return NextResponse.json(formattedLinks);

    } catch (error) {
        console.error('Link API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse('Unauthorized', { status: 401 });

        const body = await request.json();
        const { name, url, slug, affiliateId, commissionRate } = body;

        // Validation
        if (!name || !url || !slug) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        await dbConnect();

        // Check slug uniqueness
        const existing = await Link.findOne({ slug });
        if (existing) {
            return new NextResponse('Slug already in use', { status: 409 });
        }

        // Determine AffiliateOwner
        // If admin, they can pass affiliateId. If affiliate, forced to self.
        let ownerId = session.user.id;
        if (session.user.role === 'admin' && affiliateId) {
            ownerId = affiliateId;
        }

        const newLink = await Link.create({
            affiliateId: ownerId,
            name,
            url,
            slug,
            commissionRate: commissionRate || undefined, // undefined to use backup
            status: 'active'
        });

        return NextResponse.json(newLink, { status: 201 });

    } catch (error) {
        console.error('Create Link Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
