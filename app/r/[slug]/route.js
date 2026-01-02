import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { Link, ClickEvent, Analytics } from '@/lib/models';

export async function GET(request, props) {
    try {
        // Next.js 15: params is a promise
        const params = await props.params;
        await dbConnect();

        const slug = params.slug;

        // 1. Find the link by slug
        // We only redirect active links
        const link = await Link.findOne({ slug, status: 'active' });

        if (!link) {
            return new NextResponse('Link not found or inactive', { status: 404 });
        }

        // 2. Gather Request Metadata
        const headersList = request.headers;
        const ip = headersList.get('x-forwarded-for') || 'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';
        const referrer = headersList.get('referer') || 'direct';
        const deviceType = /mobile/i.test(userAgent) ? 'mobile' : 'desktop';

        // 3. Log the Click
        await ClickEvent.create({
            linkId: link._id,
            affiliateId: link.affiliateId,
            ip,
            userAgent,
            referrer,
            deviceType,
            timestamp: new Date()
        });

        await Link.findByIdAndUpdate(link._id, { $inc: { clicks: 1 } });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await Analytics.findOneAndUpdate(
            {
                date: today,
                linkId: link._id,
                affiliateId: link.affiliateId
            },
            {
                $inc: { clicks: 1 },
                $setOnInsert: { conversions: 0, revenue: 0 }
            },
            { upsert: true, new: true }
        );

        // 4. Set Attribution Cookie
        // Next.js 15: cookies() is a promise
        const cookieStore = await cookies();
        cookieStore.set('affiliate_id', link.affiliateId.toString(), {
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 Days
            httpOnly: true,
            sameSite: 'lax'
        });
        cookieStore.set('link_id', link._id.toString(), {
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
            httpOnly: true,
            sameSite: 'lax'
        });

        // 5. Redirect
        return NextResponse.redirect(new URL(link.url));

    } catch (error) {
        console.error('Redirect Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
