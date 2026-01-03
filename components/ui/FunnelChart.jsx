"use client";

import { useMemo } from "react";
import Icon from "@/components/Icon";

/**
 * FunnelChart - Visualizes Click → Signup → Purchase → Revenue funnel
 * @param {object} data - { clicks, signups, conversions, revenue }
 * @param {string} dateRange - Label for the period
 */
export default function FunnelChart({ data, dateRange = "Last 30 Days" }) {
    const funnelSteps = useMemo(() => {
        const clicks = data?.clicks || 0;
        const signups = data?.signups || 0;
        const conversions = data?.conversions || 0;
        const revenue = data?.revenue || 0;

        // Calculate percentages relative to clicks
        const getPercentage = (value) => (clicks > 0 ? ((value / clicks) * 100).toFixed(1) : 0);

        // Calculate drop-off between stages
        const getDropOff = (current, previous) => {
            if (previous === 0) return 0;
            return (((previous - current) / previous) * 100).toFixed(1);
        };

        return [
            {
                name: "Clicks",
                value: clicks,
                icon: "MousePointer2",
                color: "primary",
                percentage: 100,
                dropOff: null,
                width: 100,
            },
            {
                name: "Signups",
                value: signups,
                icon: "UserPlus",
                color: "info",
                percentage: getPercentage(signups),
                dropOff: getDropOff(signups, clicks),
                width: Math.max(20, (signups / (clicks || 1)) * 100),
            },
            {
                name: "Conversions",
                value: conversions,
                icon: "ShoppingCart",
                color: "success",
                percentage: getPercentage(conversions),
                dropOff: getDropOff(conversions, signups || clicks),
                width: Math.max(15, (conversions / (clicks || 1)) * 100),
            },
            {
                name: "Revenue",
                value: revenue,
                icon: "DollarSign",
                color: "warning",
                percentage: null, // Revenue is absolute
                dropOff: null,
                width: Math.max(10, (conversions / (clicks || 1)) * 100),
                isRevenue: true,
            },
        ];
    }, [data]);

    const formatCurrency = (val) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val || 0);

    const formatNumber = (val) => new Intl.NumberFormat("en-US").format(val || 0);

    if (!data || (data.clicks === 0 && data.conversions === 0)) {
        return (
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body items-center justify-center py-16">
                    <Icon name="TrendingUp" size={48} className="text-base-content/20 mb-3" />
                    <p className="text-base-content/50">No funnel data available</p>
                    <p className="text-xs text-base-content/30">Data will appear once you have clicks and conversions</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-linear-to-br from-primary/20 to-secondary/20 p-2 rounded-xl">
                            <Icon name="TrendingUp" size={20} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold">Conversion Funnel</h3>
                            <p className="text-xs text-base-content/50">{dateRange}</p>
                        </div>
                    </div>
                </div>

                {/* Funnel Visualization */}
                <div className="space-y-4">
                    {funnelSteps.map((step, index) => (
                        <div key={step.name} className="relative">
                            {/* Drop-off indicator */}
                            {step.dropOff && parseFloat(step.dropOff) > 0 && (
                                <div className="absolute -top-3 right-0 text-xs text-error/80 flex items-center gap-1">
                                    <Icon name="TrendingDown" size={12} />
                                    <span>{step.dropOff}% drop</span>
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                {/* Icon */}
                                <div className={`bg-${step.color}/10 p-3 rounded-xl text-${step.color} shrink-0`}>
                                    <Icon name={step.icon} size={20} />
                                </div>

                                {/* Bar Container */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">{step.name}</span>
                                        <span className="font-bold">
                                            {step.isRevenue ? formatCurrency(step.value) : formatNumber(step.value)}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-8 bg-base-200 rounded-lg overflow-hidden relative">
                                        <div
                                            className={`h-full bg-${step.color} transition-all duration-500 ease-out rounded-lg flex items-center justify-end pr-3`}
                                            style={{ width: `${step.width}%` }}
                                        >
                                            {step.percentage !== null && step.width > 25 && (
                                                <span className="text-xs font-bold text-white/90">
                                                    {step.percentage}%
                                                </span>
                                            )}
                                        </div>
                                        {step.percentage !== null && step.width <= 25 && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-base-content/60">
                                                {step.percentage}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Connector Arrow */}
                            {index < funnelSteps.length - 1 && (
                                <div className="flex justify-center py-1">
                                    <Icon name="ChevronDown" size={16} className="text-base-content/20" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-base-200">
                    <div className="text-center">
                        <p className="text-xs text-base-content/50 uppercase font-bold">Click → Sale Rate</p>
                        <p className="text-lg font-bold text-success">
                            {data.clicks > 0 ? ((data.conversions / data.clicks) * 100).toFixed(2) : 0}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-base-content/50 uppercase font-bold">Avg Order Value</p>
                        <p className="text-lg font-bold">
                            {formatCurrency(data.conversions > 0 ? data.revenue / data.conversions : 0)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-base-content/50 uppercase font-bold">Revenue / Click</p>
                        <p className="text-lg font-bold text-primary">
                            {formatCurrency(data.clicks > 0 ? data.revenue / data.clicks : 0)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
