import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER || {
    jsonTransport: true
});

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@example.com';

async function sendEmail({ to, subject, html }) {
    try {
        if (!process.env.EMAIL_SERVER) {
            console.log('--- EMAIL SIMULATION ---');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log('--- END SIMULATION ---');
            return;
        }

        await transporter.sendMail({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Email Send Error:', error);
    }
}

export async function sendWelcomeEmail(user) {
    await sendEmail({
        to: user.email,
        subject: 'Welcome to the Affiliate Program',
        html: `
      <h1>Welcome, ${user.name}!</h1>
      <p>Thanks for joining our affiliate program.</p>
      <p>You can verify your status and grab your unique links from your dashboard.</p>
      <a href="${process.env.NEXTAUTH_URL}/dashboard">Go to Dashboard</a>
    `
    });
}

export async function sendCommissionEmail(user, amount, source) {
    await sendEmail({
        to: user.email,
        subject: 'You Earned a New Commission! 💰',
        html: `
      <h1>Chajing! 💸</h1>
      <p>Congratulations ${user.name}, you just earned a commission!</p>
      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
      <p><strong>Source:</strong> ${source || 'Referral'}</p>
      <p>Keep up the great work!</p>
    `
    });
}

export async function sendPayoutRequestEmail(user, amount) {
    // Notify Admin
    /* 
    await sendEmail({
       to: process.env.ADMIN_EMAIL, 
       subject: 'New Payout Request',
       html: `User ${user.name} requested $${amount}`
    }); 
    */

    // Notify User
    await sendEmail({
        to: user.email,
        subject: 'Payout Request Received',
        html: `
      <h1>Payout Request Received</h1>
      <p>Hi ${user.name},</p>
      <p>We've received your request to withdraw <strong>$${amount.toFixed(2)}</strong>.</p>
      <p>Our team will review and process it within 2-3 business days.</p>
    `
    });
}

export async function sendPayoutProcessedEmail(user, amount, status) {
    await sendEmail({
        to: user.email,
        subject: `Payout Update: ${status.toUpperCase()}`,
        html: `
      <h1>Payout ${status === 'completed' ? 'Sent! 🚀' : 'Update'}</h1>
      <p>Hi ${user.name},</p>
      <p>Your payout of <strong>$${amount.toFixed(2)}</strong> has been marked as <strong>${status}</strong>.</p>
      ${status === 'completed' ? '<p>Please allow some time for the funds to appear in your account.</p>' : ''}
    `
    });
}
