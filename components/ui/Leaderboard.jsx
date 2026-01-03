"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";

export default function Leaderboard({ dateRange = "30d", limit = 10 }) {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchLeaderboard() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/leaderboard?range=${dateRange}&limit=${limit}`);
                if (!res.ok) throw new Error("Failed to fetch leaderboard");
                const data = await res.json();
                setLeaders(data);
            } catch (err) {
                console.error("Leaderboard Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, [dateRange, limit]);

    const formatCurrency = (val) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(val || 0);

    const getRankBadge = (rank) => {
        if (rank === 1)
            return (
                <div className="bg-linear-to-br from-yellow-400 to-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                    <Icon name="Crown" size={16} />
                </div>
            );
        if (rank === 2)
            return (
                <div className="bg-linear-to-br from-gray-300 to-gray-400 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow">
                    2
                </div>
            );
        if (rank === 3)
            return (
                <div className="bg-linear-to-br from-amber-600 to-amber-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow">
                    3
                </div>
            );
        return (
            <div className="bg-base-200 text-base-content/70 w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm">
                {rank}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="skeleton w-6 h-6 rounded-full"></div>
                        <div className="skeleton h-6 w-32"></div>
                    </div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-3">
                            <div className="skeleton w-8 h-8 rounded-full"></div>
                            <div className="skeleton w-10 h-10 rounded-full"></div>
                            <div className="flex-1">
                                <div className="skeleton h-4 w-24 mb-1"></div>
                                <div className="skeleton h-3 w-16"></div>
                            </div>
                            <div className="skeleton h-5 w-16"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card bg-base-100 shadow-sm border border-error/30">
                <div className="card-body items-center text-center">
                    <Icon name="AlertCircle" className="text-error" size={32} />
                    <p className="text-error text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-0">
                <div className="p-6 border-b border-base-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-linear-to-br from-primary/20 to-secondary/20 p-2 rounded-xl">
                            <Icon name="Trophy" size={20} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold">Top Performers</h3>
                            <p className="text-xs text-base-content/50">Ranked by revenue</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {leaders.length > 0 ? (
                        <table className="table table-sm">
                            <thead className="bg-base-50 text-xs font-bold uppercase text-base-content/60">
                                <tr>
                                    <th className="w-16">Rank</th>
                                    <th>Affiliate</th>
                                    <th className="text-right">Revenue</th>
                                    <th className="text-right hidden md:table-cell">Clicks</th>
                                    <th className="text-right hidden md:table-cell">Conv.</th>
                                    <th className="text-right hidden sm:table-cell">Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaders.map((leader) => (
                                    <tr key={leader.affiliateId} className="hover:bg-base-50">
                                        <td className="py-3">{getRankBadge(leader.rank)}</td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="avatar placeholder">
                                                    <div className="bg-primary/10 text-primary rounded-full w-10">
                                                        <span className="font-bold">
                                                            {leader.name?.charAt(0)?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{leader.name}</p>
                                                    <p className="text-xs text-base-content/50 max-w-[120px] truncate">
                                                        {leader.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-right font-bold text-success py-3">
                                            {formatCurrency(leader.revenue)}
                                        </td>
                                        <td className="text-right py-3 hidden md:table-cell">
                                            {leader.clicks?.toLocaleString()}
                                        </td>
                                        <td className="text-right py-3 hidden md:table-cell">
                                            {leader.conversions?.toLocaleString()}
                                        </td>
                                        <td className="text-right py-3 hidden sm:table-cell">
                                            <span className="badge badge-ghost badge-sm">
                                                {leader.conversionRate?.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-base-content/40">
                            <Icon name="Users" size={40} className="mx-auto mb-3 opacity-40" />
                            <p>No performance data yet</p>
                            <p className="text-xs mt-1">Rankings will appear once affiliates generate revenue</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
