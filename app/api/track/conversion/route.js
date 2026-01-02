import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { processCommission } from '@/lib/commission';

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { affiliate_id, link_id, amount, unique_id } = body;

        if (!affiliate_id || !amount) {
            return new NextResponse(
                JSON.stringify({ error: 'Missing required fields: affiliate_id, amount' }),
                {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                }
            );
        }

        const result = await processCommission({
            affiliateId: affiliate_id,
            linkId: link_id,
            saleAmount: parseFloat(amount),
            description: 'Conversion via Client-side Pixel',
            uniqueId: unique_id || `pixel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

        if (!result.success) {
            return new NextResponse(
                JSON.stringify({ error: result.error }),
                {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                }
            );
        }

        return new NextResponse(
            JSON.stringify(result),
            {
                status: 200,
                headers: { 'Access-Control-Allow-Origin': '*' }
            }
        );

    } catch (error) {
        console.error('Conversion Pixel Error:', error);
        return new NextResponse(
            JSON.stringify({ error: 'Internal Server Error' }),
            {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' }
            }
        );
    }
}
