
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/Icon";

export default function FraudDashboardPage() {
    const router = useRouter();
    const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            if (!isAuthenticated) return;
            if (currentUser?.role !== 'admin') {
                router.push('/dashboard');
                return;
            }

            try {
                const res = await fetch('/api/admin/fraud');
                if (!res.ok) throw new Error("Failed to fetch fraud stats");
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err) {
                console.error("Fraud Dashboard Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading && currentUser) {
            fetchData();
        }
    }, [isAuthenticated, authLoading, currentUser, router]);

    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error shadow-lg max-w-2xl mx-auto mt-10">
                <Icon name="AlertTriangle" />
                <span>Error: {error}</span>
            </div>
        );
    }

    if (currentUser?.role !== 'admin') return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
                        <Icon name="ShieldAlert" className="text-error" />
                        Fraud Detection Center
                    </h2>
                    <p className="text-base-content/60 text-sm">Monitor suspicious activity and bot traffic.</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
                    <Icon name="RefreshCw" size={16} />
                    Refresh
                </button>
            </div>

            {/* Top Offenders */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <h3 className="card-title text-base mb-4">Top Suspicious Affiliates</h3>
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>Affiliate</th>
                                    <th>Suspicious Clicks</th>
                                    <th>Avg Risk Score</th>
                                    <th>Last Activity</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.topOffenders?.length > 0 ? (
                                    data.topOffenders.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="avatar placeholder">
                                                        <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                                                            <span className="text-xs">{item.affiliate?.name?.charAt(0)}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{item.affiliate?.name || 'Unknown'}</div>
                                                        <div className="text-xs opacity-50">{item.affiliate?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-error font-mono">{item.suspiciousClicks}</td>
                                            <td>
                                                <div className={`badge ${item.avgFraudScore > 50 ? 'badge-error' : 'badge-warning'}`}>
                                                    {item.avgFraudScore} / 100
                                                </div>
                                            </td>
                                            <td className="text-xs">{new Date(item.lastActivity).toLocaleString()}</td>
                                            <td>
                                                <a href={`/affiliates?search=${item.affiliate?.email}`} className="btn btn-xs btn-ghost">
                                                    Review
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-base-content/50 py-4">No high-risk affiliates found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Recent Suspicious Clicks */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <h3 className="card-title text-base mb-4">Recent Suspicious Clicks</h3>
                    <div className="overflow-x-auto">
                        <table className="table table-xs">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Link</th>
                                    <th>Affiliate</th>
                                    <th>IP Address</th>
                                    <th>Risk Type</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.recentClicks?.length > 0 ? (
                                    data.recentClicks.map((click) => (
                                        <tr key={click._id}>
                                            <td className="whitespace-nowrap">{new Date(click.timestamp).toLocaleString()}</td>
                                            <td>{click.linkId?.name || 'Deleted Link'}</td>
                                            <td>{click.affiliateId?.name || 'Unknown'}</td>
                                            <td className="font-mono">{click.ip}</td>
                                            <td>
                                                {click.isBot ? (
                                                    <span className="badge badge-error badge-xs badge-outline">BOT</span>
                                                ) : click.fraudScore > 0 ? (
                                                    <span className="badge badge-warning badge-xs badge-outline">RATE LIMIT</span>
                                                ) : (
                                                    <span className="badge badge-ghost badge-xs">UNKNOWN</span>
                                                )}
                                            </td>
                                            <td className="max-w-xs truncate text-xs opacity-60" title={click.userAgent}>
                                                {click.userAgent}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center text-base-content/50 py-4">No recent suspicious clicks.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
