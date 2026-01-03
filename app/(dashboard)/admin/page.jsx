"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/Icon";
import StatCard from "@/components/ui/StatCard";

export default function AdminDashboardPage() {
    const router = useRouter();
    const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();

    const [stats, setStats] = useState(null);
    const [pendingAffiliates, setPendingAffiliates] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!isAuthenticated) return;
            if (currentUser?.role !== 'admin') {
                router.push('/dashboard');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [statsRes, usersRes, logsRes] = await Promise.all([
                    fetch('/api/admin/stats'),
                    fetch('/api/users?status=pending'),
                    fetch('/api/admin/audit-logs?limit=10')
                ]);

                if (!statsRes.ok) throw new Error("Failed to fetch admin stats");

                const statsData = await statsRes.json();
                const usersData = usersRes.ok ? await usersRes.json() : [];
                const logsData = logsRes.ok ? await logsRes.json() : [];

                setStats(statsData);
                setPendingAffiliates(usersData.filter(u => u.status === 'pending'));
                setAuditLogs(logsData);
            } catch (err) {
                console.error("Admin Dashboard Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading && currentUser) {
            fetchData();
        }
    }, [isAuthenticated, authLoading, currentUser, router]);

    const handleApprove = async (userId) => {
        if (processing) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' })
            });
            if (!res.ok) throw new Error("Approval failed");
            setPendingAffiliates(prev => prev.filter(u => u.id !== userId && u._id !== userId));
        } catch (err) {
            console.error("Approve Error:", err);
            alert("Failed to approve affiliate");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (userId) => {
        if (processing) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'inactive' })
            });
            if (!res.ok) throw new Error("Rejection failed");
            setPendingAffiliates(prev => prev.filter(u => u.id !== userId && u._id !== userId));
        } catch (err) {
            console.error("Reject Error:", err);
            alert("Failed to reject affiliate");
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
    const formatDate = (date) => new Date(date).toLocaleString();

    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-base-content/50 mt-4 animate-pulse">Loading admin dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error shadow-lg max-w-2xl mx-auto mt-10">
                <Icon name="AlertTriangle" />
                <span>Error loading dashboard: {error}</span>
                <button className="btn btn-xs" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    if (currentUser?.role !== 'admin') return null;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-base-content">Admin Dashboard</h2>
                <p className="text-base-content/60 text-sm">System overview and management controls.</p>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Affiliates"
                    value={stats?.totalAffiliates || 0}
                    icon="Users"
                    color="primary"
                />
                <StatCard
                    title="Active Affiliates"
                    value={stats?.activeAffiliates || 0}
                    icon="UserCheck"
                    color="success"
                />
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats?.totalRevenue)}
                    icon="DollarSign"
                    color="accent"
                />
                <StatCard
                    title="Pending Payouts"
                    value={formatCurrency(stats?.pendingPayouts)}
                    icon="Clock"
                    color="warning"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Affiliates */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-0">
                        <div className="p-6 border-b border-base-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-warning/10 p-2 rounded-lg text-warning">
                                    <Icon name="UserPlus" size={20} />
                                </div>
                                <h3 className="font-bold">Pending Approvals</h3>
                            </div>
                            <div className="badge badge-warning badge-sm">{pendingAffiliates.length}</div>
                        </div>
                        <div className="max-h-[350px] overflow-y-auto">
                            {pendingAffiliates.length > 0 ? (
                                <ul className="divide-y divide-base-200">
                                    {pendingAffiliates.map((user) => (
                                        <li key={user.id || user._id} className="p-4 flex items-center justify-between hover:bg-base-50">
                                            <div className="flex items-center gap-3">
                                                <div className="avatar placeholder">
                                                    <div className="bg-primary/10 text-primary rounded-full w-10">
                                                        <span className="text-sm font-bold">{user.name?.charAt(0)?.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-xs text-base-content/50">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-success btn-sm btn-outline"
                                                    onClick={() => handleApprove(user.id || user._id)}
                                                    disabled={processing}
                                                >
                                                    <Icon name="Check" size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-error btn-sm btn-outline"
                                                    onClick={() => handleReject(user.id || user._id)}
                                                    disabled={processing}
                                                >
                                                    <Icon name="X" size={14} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-base-content/40">
                                    <Icon name="CheckCircle2" size={32} className="mx-auto mb-2 text-success/50" />
                                    <p className="text-sm">No pending approvals</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Audit Logs */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-0">
                        <div className="p-6 border-b border-base-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-secondary/10 p-2 rounded-lg text-secondary">
                                    <Icon name="ScrollText" size={20} />
                                </div>
                                <h3 className="font-bold">Recent Activity</h3>
                            </div>
                            <a href="/admin/audit" className="text-xs text-primary hover:underline">View All</a>
                        </div>
                        <div className="max-h-[350px] overflow-y-auto">
                            {auditLogs.length > 0 ? (
                                <ul className="divide-y divide-base-200">
                                    {auditLogs.map((log, idx) => (
                                        <li key={log._id || idx} className="p-4 hover:bg-base-50">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-base-200 p-2 rounded-lg">
                                                    <Icon name="Activity" size={16} className="text-base-content/60" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{log.action}</p>
                                                    <p className="text-xs text-base-content/50 mt-0.5">
                                                        {log.targetType && <span className="badge badge-ghost badge-xs mr-2">{log.targetType}</span>}
                                                        {formatDate(log.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-base-content/40">
                                    <Icon name="FileText" size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <h3 className="font-bold mb-4">Quick Actions</h3>
                    <div className="flex flex-wrap gap-3">
                        <a href="/affiliates" className="btn btn-outline gap-2">
                            <Icon name="Users" size={18} />
                            Manage Affiliates
                        </a>
                        <a href="/links" className="btn btn-outline gap-2">
                            <Icon name="Link" size={18} />
                            View All Links
                        </a>
                        <a href="/admin/fraud" className="btn btn-outline gap-2 text-error hover:text-white">
                            <Icon name="ShieldAlert" size={18} />
                            Fraud Detection
                        </a>
                        <a href="/payments" className="btn btn-outline gap-2">
                            <Icon name="CreditCard" size={18} />
                            Process Payouts
                        </a>
                        <a href="/reports" className="btn btn-outline gap-2">
                            <Icon name="BarChart3" size={18} />
                            View Reports
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
