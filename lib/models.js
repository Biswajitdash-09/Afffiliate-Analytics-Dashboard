import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // Hashed password
    role: { type: String, enum: ['admin', 'affiliate'], default: 'affiliate' },
    avatar: { type: String },
    balance: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 10 }, // Default 10%
    commissionTiers: [
        { minSales: { type: Number }, rate: { type: Number } }
    ],
    status: { type: String, enum: ['active', 'suspended', 'inactive', 'pending'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

// Link/Campaign Schema
const LinkSchema = new mongoose.Schema({
    affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    commissionRate: { type: Number }, // Optional override
    commissionTiers: [
        { minSales: { type: Number }, rate: { type: Number } }
    ],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
});

// Commission Schema (Earnings Ledger)
const CommissionSchema = new mongoose.Schema({
    affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link' },
    amount: { type: Number, required: true }, // The commission amount earned
    saleAmount: { type: Number, required: true }, // The total sale value
    rateUsed: { type: Number }, // The percentage used (e.g. 10 or 15)
    currency: { type: String, default: 'USD' },
    description: { type: String }, // Product name or details from Stripe
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid', 'reversed'], default: 'pending' },
    stripeSessionId: { type: String, unique: true, sparse: true },
    stripeChargeId: { type: String, index: true }, // For refund lookups
    // Refund/Chargeback tracking
    reversedAt: { type: Date },
    reverseReason: { type: String }, // 'refund', 'chargeback', 'dispute'
    reverseAmount: { type: Number }, // Partial refund amount
    createdAt: { type: Date, default: Date.now },
});


// Payout Schema
const PayoutSchema = new mongoose.Schema({
    affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['processing', 'completed', 'rejected'], default: 'processing' },
    method: { type: String, required: true },
    date: { type: Date, default: Date.now },
});

// Analytics Schema (Daily Aggregates PER LINK)
const AnalyticsSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link' },
    affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
});
// Compound index for efficient lookup
AnalyticsSchema.index({ date: 1, linkId: 1, affiliateId: 1 }, { unique: true });

// Click Event Schema (Granular Logging)
const ClickEventSchema = new mongoose.Schema({
    linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true },
    affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ip: { type: String },
    userAgent: { type: String },
    referrer: { type: String },
    country: { type: String }, // Optional, needs GeoIP lookup later
    isBot: { type: Boolean, default: false },
    botType: { type: String },
    fraudScore: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    deviceType: { type: String } // e.g. 'mobile', 'desktop'
});

// Audit Log Schema for Admin Actions & Fraud Detection
const AuditLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true }, // e.g., 'UPDATE_COMMISSION', 'SUSPEND_USER'
    targetId: { type: mongoose.Schema.Types.ObjectId }, // ID of the affected object
    targetType: { type: String }, // 'User', 'Link', 'Payout'
    details: { type: Object }, // Before/After values
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now },
});

// Prevent model recompilation error in Next.js development
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Link = mongoose.models.Link || mongoose.model('Link', LinkSchema);
export const Payout = mongoose.models.Payout || mongoose.model('Payout', PayoutSchema);
export const Commission = mongoose.models.Commission || mongoose.model('Commission', CommissionSchema);
export const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);
export const ClickEvent = mongoose.models.ClickEvent || mongoose.model('ClickEvent', ClickEventSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
