import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';

export async function POST(request) {
    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        await dbConnect();

        // 1. Check duplicate
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return new NextResponse('Email already in use', { status: 409 });
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create User
        // Default status is defined in schema (e.g. 'pending')
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'affiliate',
            status: 'active' // Auto-approve for MVP
        });

        // Send Welcome Email
        try {
            const { sendWelcomeEmail } = await import('@/lib/email');
            await sendWelcomeEmail(newUser);
        } catch (emailErr) {
            console.error('Failed to send welcome email:', emailErr);
            // Don't block registration
        }

        return NextResponse.json({ message: 'User created' }, { status: 201 });

    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
