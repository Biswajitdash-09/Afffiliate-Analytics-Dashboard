"use client";

import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/Icon";

/**
 * PerformanceBreakdown - Shows performance by affiliate or campaign
 * @param {string} type - 'affiliate' or 'campaign'
 * @param {array} data - Array of performance records
 */
export default function PerformanceBreakdown({ type = "campaign", data = [], loading = false }) {
    const [sortBy, setSortBy] = useState("revenue");
    const [sortOrder, setSortOrder] = useState("desc");

    const sortedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        return [...data].sort((a, b) => {
            const aVal = a[sortBy] || 0;
            const bVal = b[sortBy] || 0;
            return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
        });
    }, [data, sortBy, sortOrder]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val || 0);

    const formatNumber = (val) => new Intl.NumberFormat("en-US").format(val || 0);

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <Icon name="ArrowUpDown" size={12} className="opacity-30" />;
        return sortOrder === "desc" ? (
            <Icon name="ArrowDown" size={12} className="text-primary" />
        ) : (
            <Icon name="ArrowUp" size={12} className="text-primary" />
        );
    };

    const getMaxValue = (field) => {
        if (sortedData.length === 0) return 1;
        return Math.max(...sortedData.map((d) => d[field] || 0), 1);
    };

    if (loading) {
        return (
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="skeleton w-6 h-6 rounded"></div>
                        <div className="skeleton h-5 w-40"></div>
                    </div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="skeleton w-8 h-8 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="skeleton h-4 w-32 mb-1"></div>
                                    <div className="skeleton h-6 w-full rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body items-center justify-center py-12">
                    <Icon
                        name={type === "affiliate" ? "Users" : "Link"}
                        size={40}
                        className="text-base-content/20 mb-3"
                    />
                    <p className="text-base-content/50">No {type} data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-0">
                {/* Header */}
                <div className="p-6 border-b border-base-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`bg-${type === "affiliate" ? "primary" : "secondary"}/10 p-2 rounded-xl`}>
                            <Icon
                                name={type === "affiliate" ? "Users" : "Link"}
                                size={20}
                                className={`text-${type === "affiliate" ? "primary" : "secondary"}`}
                            />
                        </div>
                        <div>
                            <h3 className="font-bold">
                                {type === "affiliate" ? "Affiliate Performance" : "Campaign Performance"}
                            </h3>
                            <p className="text-xs text-base-content/50">
                                Top {sortedData.length} by {sortBy}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="table table-sm">
                        <thead className="bg-base-50">
                            <tr className="text-xs uppercase text-base-content/60">
                                <th className="w-12">#</th>
                                <th>{type === "affiliate" ? "Affiliate" : "Campaign"}</th>
                                <th
                                    className="cursor-pointer hover:text-primary transition-colors text-right"
                                    onClick={() => handleSort("clicks")}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Clicks <SortIcon field="clicks" />
                                    </div>
                                </th>
                                <th
                                    className="cursor-pointer hover:text-primary transition-colors text-right"
                                    onClick={() => handleSort("conversions")}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Conv. <SortIcon field="conversions" />
                                    </div>
                                </th>
                                <th
                                    className="cursor-pointer hover:text-primary transition-colors text-right"
                                    onClick={() => handleSort("conversionRate")}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Rate <SortIcon field="conversionRate" />
                                    </div>
                                </th>
                                <th
                                    className="cursor-pointer hover:text-primary transition-colors text-right"
                                    onClick={() => handleSort("revenue")}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Revenue <SortIcon field="revenue" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((item, index) => (
                                <tr key={item.affiliateId || item.linkId || index} className="hover:bg-base-50">
                                    <td className="font-medium text-base-content/50">{index + 1}</td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            {type === "affiliate" ? (
                                                <div className="avatar placeholder">
                                                    <div className="bg-primary/10 text-primary rounded-full w-8">
                                                        <span className="text-xs font-bold">
                                                            {item.name?.charAt(0)?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-secondary/10 p-1.5 rounded text-secondary">
                                                    <Icon name="Link" size={14} />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-medium truncate max-w-[150px]">{item.name}</p>
                                                {item.email && (
                                                    <p className="text-xs text-base-content/40 truncate max-w-[150px]">
                                                        {item.email}
                                                    </p>
                                                )}
                                                {item.slug && (
                                                    <p className="text-xs text-base-content/40">/r/{item.slug}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-medium">{formatNumber(item.clicks)}</span>
                                            <div className="w-16 h-1.5 bg-base-200 rounded-full mt-1">
                                                <div
                                                    className="h-full bg-primary/50 rounded-full"
                                                    style={{ width: `${(item.clicks / getMaxValue("clicks")) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <span className="font-medium">{formatNumber(item.conversions)}</span>
                                    </td>
                                    <td className="text-right">
                                        <span
                                            className={`badge badge-sm ${item.conversionRate > 5
                                                    ? "badge-success"
                                                    : item.conversionRate > 2
                                                        ? "badge-warning"
                                                        : "badge-ghost"
                                                }`}
                                        >
                                            {(item.conversionRate || 0).toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <span className="font-bold text-success">{formatCurrency(item.revenue)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
