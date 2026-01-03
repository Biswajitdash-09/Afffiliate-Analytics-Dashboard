"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/Icon";
import LinkTable from "@/components/ui/LinkTable";
import FunnelChart from "@/components/ui/FunnelChart";
import PerformanceBreakdown from "@/components/ui/PerformanceBreakdown";

export default function ReportsPage() {
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'daily', 'campaigns'
  const [dateRange, setDateRange] = useState("30d");

  const [analyticsData, setAnalyticsData] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [linksData, setLinksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return;
      setLoading(true);
      setError(null);

      try {
        const [analyticsRes, linksRes, funnelRes] = await Promise.all([
          fetch(`/api/analytics?range=${dateRange}`),
          fetch('/api/links'),
          fetch(`/api/funnel?range=${dateRange}`)
        ]);

        if (!analyticsRes.ok || !linksRes.ok) throw new Error("Failed to fetch reports");

        const analytics = await analyticsRes.json();
        const links = await linksRes.json();
        const funnel = funnelRes.ok ? await funnelRes.json() : null;

        setAnalyticsData(analytics);
        setLinksData(links);
        setFunnelData(funnel);

      } catch (err) {
        console.error("Reports Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchData();
    }
  }, [dateRange, isAuthenticated, authLoading]);

  // Computed Summary from Analytics API
  const summary = analyticsData?.summary || { revenue: 0, clicks: 0, conversions: 0 };
  const dailyStats = (analyticsData?.chart || []).sort((a, b) => new Date(b._id) - new Date(a._id));

  // Computed Metrics
  const conversionRate = summary.clicks > 0 ? (summary.conversions / summary.clicks) * 100 : 0;
  const epc = summary.clicks > 0 ? summary.revenue / summary.clicks : 0;
  const aov = summary.conversions > 0 ? summary.revenue / summary.conversions : 0;

  // CSV Export
  const downloadCSV = () => {
    if (!analyticsData) return;

    let headers = [];
    let rows = [];
    let filename = "";

    const escape = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    if (activeTab === 'daily' || activeTab === 'overview') {
      headers = ["Date", "Clicks", "Conversions", "Revenue ($)"];
      rows = dailyStats.map(day => [
        day._id,
        day.clicks,
        day.conversions,
        day.revenue.toFixed(2)
      ]);
      filename = `daily_report_${dateRange}.csv`;
    } else {
      headers = ["Campaign Name", "Slug", "URL", "Clicks", "Conversions", "Revenue ($)", "Status"];
      rows = linksData.map(link => [
        link.name,
        link.slug,
        link.url,
        link.clicks,
        link.conversions,
        link.revenue.toFixed(2),
        link.status
      ]);
      filename = `campaign_performance_${dateRange}.csv`;
    }

    const csvContent = [headers.join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const downloadPDF = async () => {
    if (!analyticsData) return;
    setExporting(true);

    try {
      // Dynamic import to avoid SSR issues
      const { generatePDFReport } = await import('@/lib/pdfExport');

      generatePDFReport({
        summary,
        dailyStats,
        campaigns: funnelData?.campaignBreakdown || linksData.map(l => ({
          name: l.name,
          clicks: l.clicks,
          conversions: l.conversions,
          revenue: l.revenue,
          conversionRate: l.clicks > 0 ? (l.conversions / l.clicks) * 100 : 0
        })),
        dateRange: dateRange === '7d' ? 'Last 7 Days' : dateRange === '30d' ? 'Last 30 Days' : 'Last 90 Days',
        reportTitle: 'Affiliate Performance Report'
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  const formatNumber = (val) => new Intl.NumberFormat('en-US').format(val || 0);

  const getDateRangeLabel = () => {
    if (dateRange === '7d') return 'Last 7 Days';
    if (dateRange === '30d') return 'Last 30 Days';
    if (dateRange === '90d') return 'Last 90 Days';
    return 'All Time';
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/50 mt-4 animate-pulse">Generating reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg max-w-2xl mx-auto mt-10">
        <Icon name="AlertTriangle" />
        <span>Error loading reports: {error}</span>
        <button className="btn btn-xs" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Performance Reports</h2>
          <p className="text-base-content/60 text-sm">Detailed metrics and analytics for your campaigns.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="join shadow-sm border border-base-300 rounded-lg">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`join-item btn btn-sm ${dateRange === range ? 'btn-active btn-primary' : 'bg-base-100'}`}
              >
                {range === '7d' ? '7D' : range === '30d' ? '30D' : '90D'}
              </button>
            ))}
          </div>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-sm btn-outline gap-2">
              <Icon name="Download" size={16} />
              Export
              <Icon name="ChevronDown" size={14} />
            </label>
            <ul tabIndex={0} className="dropdown-content z-1 menu p-2 shadow-lg bg-base-100 rounded-box w-40 border border-base-200">
              <li>
                <button onClick={downloadCSV} className="gap-2">
                  <Icon name="FileSpreadsheet" size={16} />
                  CSV
                </button>
              </li>
              <li>
                <button onClick={downloadPDF} disabled={exporting} className="gap-2">
                  <Icon name="FileText" size={16} />
                  {exporting ? 'Generating...' : 'PDF'}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
          <p className="text-xs font-bold uppercase text-base-content/60 mb-1">Revenue</p>
          <div className="text-xl font-bold">{formatCurrency(summary.revenue)}</div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
          <p className="text-xs font-bold uppercase text-base-content/60 mb-1">Clicks</p>
          <div className="text-xl font-bold">{formatNumber(summary.clicks)}</div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
          <p className="text-xs font-bold uppercase text-base-content/60 mb-1">Sales</p>
          <div className="text-xl font-bold">{formatNumber(summary.conversions)}</div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
          <p className="text-xs font-bold uppercase text-base-content/60 mb-1">Conv. Rate</p>
          <div className="text-xl font-bold">{conversionRate.toFixed(2)}%</div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
          <p className="text-xs font-bold uppercase text-base-content/60 mb-1">EPC</p>
          <div className="text-xl font-bold">{formatCurrency(epc)}</div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
          <p className="text-xs font-bold uppercase text-base-content/60 mb-1">AOV</p>
          <div className="text-xl font-bold">{formatCurrency(aov)}</div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex flex-col gap-6">
        <div className="tabs tabs-boxed bg-base-100 border border-base-200 p-1 w-fit">
          <a
            className={`tab gap-2 ${activeTab === 'overview' ? 'tab-active bg-primary text-primary-content' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Icon name="TrendingUp" size={16} />
            Overview
          </a>
          <a
            className={`tab gap-2 ${activeTab === 'daily' ? 'tab-active bg-primary text-primary-content' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            <Icon name="Calendar" size={16} />
            Daily
          </a>
          <a
            className={`tab gap-2 ${activeTab === 'campaigns' ? 'tab-active bg-primary text-primary-content' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            <Icon name="Link" size={16} />
            Campaigns
          </a>
        </div>

        <div className="animate-fade-in">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Funnel Chart */}
              <FunnelChart
                data={funnelData?.funnel || {
                  clicks: summary.clicks,
                  signups: Math.round(summary.clicks * 0.3),
                  conversions: summary.conversions,
                  revenue: summary.revenue
                }}
                dateRange={getDateRangeLabel()}
              />

              {/* Campaign Performance */}
              <PerformanceBreakdown
                type="campaign"
                data={funnelData?.campaignBreakdown || linksData.map(l => ({
                  linkId: l.id,
                  name: l.name,
                  slug: l.slug,
                  clicks: l.clicks || 0,
                  conversions: l.conversions || 0,
                  revenue: l.revenue || 0,
                  conversionRate: l.clicks > 0 ? (l.conversions / l.clicks) * 100 : 0
                }))}
                loading={loading}
              />

              {/* Affiliate Performance (Admin Only) */}
              {currentUser?.role === 'admin' && funnelData?.affiliateBreakdown?.length > 0 && (
                <div className="lg:col-span-2">
                  <PerformanceBreakdown
                    type="affiliate"
                    data={funnelData.affiliateBreakdown}
                    loading={loading}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'daily' && (
            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead className="bg-base-200/50 text-xs uppercase font-bold text-base-content/60">
                    <tr>
                      <th className="pl-6 py-4">Date</th>
                      <th className="text-right">Clicks</th>
                      <th className="text-right">Conversions</th>
                      <th className="text-right pr-6">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.map((day, idx) => (
                      <tr key={idx}>
                        <td className="pl-6 font-medium">{day._id}</td>
                        <td className="text-right">{formatNumber(day.clicks)}</td>
                        <td className="text-right">{formatNumber(day.conversions)}</td>
                        <td className="text-right pr-6 font-bold">{formatCurrency(day.revenue)}</td>
                      </tr>
                    ))}
                    {dailyStats.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-base-content/40">No data found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <LinkTable
              links={linksData}
              currentUserRole={currentUser?.role}
              onEdit={() => { }}
              onDelete={() => { }}
            />
          )}
        </div>
      </div>
    </div>
  );
}