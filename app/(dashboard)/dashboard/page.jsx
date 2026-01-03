"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/Icon";
import StatCard from "@/components/ui/StatCard";
import SimpleChart from "@/components/ui/SimpleChart";
import Leaderboard from "@/components/ui/Leaderboard";

export default function DashboardPage() {
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    async function fetchAnalytics() {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/analytics?range=${dateRange}`);
        if (!response.ok) throw new Error("Failed to fetch analytics");
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Dashboard Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchAnalytics();
    }
  }, [dateRange, isAuthenticated, authLoading]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getPeriodLabel = () => {
    if (dateRange === '7d') return 'Last 7 Days';
    if (dateRange === '30d') return 'Last 30 Days';
    if (dateRange === '90d') return 'Last 90 Days';
    return 'All Time';
  };

  // Loading State
  if (loading || authLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>
        <div className="skeleton h-[400px] w-full bg-base-100 rounded-box"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg">
        <Icon name="AlertTriangle" />
        <span>Error loading dashboard: {error}</span>
        <button className="btn btn-xs" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Dashboard Overview</h2>
          <p className="text-base-content/60 text-sm">
            Welcome back, {currentUser.name}. Here's your performance summary.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Date Range Filter */}
          <div className="join shadow-sm border border-base-300 rounded-lg">
            <button
              className={`join-item btn btn-sm ${dateRange === '7d' ? 'btn-active btn-primary' : 'bg-base-100 hover:bg-base-200'}`}
              onClick={() => setDateRange('7d')}
            >
              7D
            </button>
            <button
              className={`join-item btn btn-sm ${dateRange === '30d' ? 'btn-active btn-primary' : 'bg-base-100 hover:bg-base-200'}`}
              onClick={() => setDateRange('30d')}
            >
              30D
            </button>
            <button
              className={`join-item btn btn-sm ${dateRange === '90d' ? 'btn-active btn-primary' : 'bg-base-100 hover:bg-base-200'}`}
              onClick={() => setDateRange('90d')}
            >
              90D
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.summary?.revenue)}
          icon="DollarSign"
          color="success"
          trend="neutral"
          description={getPeriodLabel()}
        />
        <StatCard
          title="Total Clicks"
          value={(stats?.summary?.clicks || 0).toLocaleString()}
          icon="MousePointer2"
          color="primary"
          trend="neutral"
          description={getPeriodLabel()}
        />
        <StatCard
          title="Conversions"
          value={(stats?.summary?.conversions || 0).toLocaleString()}
          icon="ShoppingBag"
          color="secondary"
          trend="neutral"
          description={`Conv. Rate: ${stats?.summary?.clicks > 0 ? ((stats.summary.conversions / stats.summary.clicks) * 100).toFixed(1) : 0}%`}
        />
        <StatCard
          title="Avg. Commission"
          value={formatCurrency(stats?.summary?.revenue && stats?.summary?.conversions ? stats.summary.revenue / stats.summary.conversions : 0)}
          icon="CreditCard"
          color="accent"
          trend="neutral"
          description="Per Conversion"
        />
      </div>

      {/* Charts & Top Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="card-title text-lg">Revenue Analytics</h3>
                <p className="text-xs text-base-content/50">Performance over {getPeriodLabel().toLowerCase()}</p>
              </div>
            </div>
            <div className="w-full h-[300px]">
              {stats?.chart?.length > 0 ? (
                <SimpleChart
                  data={stats.chart.map(d => ({ ...d, date: new Date(d._id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }))}
                  xKey="date"
                  yKey="revenue"
                  color="primary"
                  height={300}
                  formatValue={(v) => `$${v}`}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-base-content/30">
                  No data available for this period
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Links */}
        <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
          <div className="card-body p-0">
            <div className="p-6 border-b border-base-200 flex justify-between items-center">
              <h3 className="font-bold text-base-content">Top Performing Links</h3>
              <Link href="/links" className="text-xs text-primary hover:underline">View All</Link>
            </div>
            <div className="overflow-y-auto max-h-[350px]">
              {stats?.topLinks?.length > 0 ? (
                <ul className="menu w-full p-0">
                  {stats.topLinks.map((link) => (
                    <li key={link.id} className="border-b border-base-100 last:border-0">
                      <a className="flex items-center justify-between py-4 px-6 hover:bg-base-50 rounded-none">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-primary/10 p-2 rounded-lg text-primary">
                            <Icon name="Link" size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[120px]">{link.name}</p>
                            <p className="text-xs text-base-content/50">{link.clicks} clicks</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(link.revenue)}</p>
                          <p className="text-xs text-success">{((link.conversions / (link.clicks || 1)) * 100).toFixed(1)}%</p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-base-content/40">
                  <Icon name="Link2Off" size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No activity found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard - Admin Only */}
      {currentUser?.role === 'admin' && (
        <div className="mt-8">
          <Leaderboard dateRange={dateRange} limit={10} />
        </div>
      )}
    </div>
  );
}