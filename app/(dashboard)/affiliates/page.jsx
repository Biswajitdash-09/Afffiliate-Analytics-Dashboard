"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AffiliateTable from "@/components/ui/AffiliateTable";
import Icon from "@/components/Icon";

export default function AffiliatesPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return;
      if (currentUser?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setLoading(true);
      try {
        const [usersRes, linksRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/links')
        ]);

        if (!usersRes.ok || !linksRes.ok) throw new Error("Failed to fetch affiliate data");

        const usersData = await usersRes.json();
        const linksData = await linksRes.json();

        setUsers(usersData);
        setLinks(linksData);
      } catch (err) {
        console.error("Affiliates Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && currentUser) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, currentUser, router]);

  // Filter Affiliates
  const filteredAffiliates = useMemo(() => {
    return users.filter(u => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    });
  }, [users, searchTerm]);

  // Handle Status Toggle
  const handleToggleStatus = async (userId, currentStatus) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Update failed");

      // Optimistic Update locally
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));

    } catch (err) {
      console.error("Failed to update user status:", err);
      alert("Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCommission = async (userId, newRate) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate: newRate })
      });

      if (!res.ok) throw new Error("Update failed");

      setUsers(users.map(u => u.id === userId ? { ...u, commissionRate: newRate } : u));
    } catch (err) {
      console.error("Failed to update commission:", err);
      alert("Failed to update commission");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/50 mt-4 animate-pulse">Loading affiliate data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg max-w-2xl mx-auto mt-10">
        <Icon name="AlertTriangle" />
        <span>Error loading data: {error}</span>
        <button className="btn btn-xs" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Affiliate Management</h2>
          <p className="text-base-content/60 text-sm">
            Monitor and manage your affiliate partners and their performance.
          </p>
        </div>

        {/* Actions / Search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name="Search" size={16} className="text-base-content/40" />
            </div>
            <input
              type="text"
              placeholder="Search affiliates..."
              className="input input-bordered pl-10 w-full input-sm md:input-md focus:input-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn btn-primary btn-sm md:btn-md gap-2 shadow-lg shadow-primary/20">
            <Icon name="UserPlus" size={18} />
            <span className="hidden sm:inline">Invite Affiliate</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Icon name="Users" size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-base-content/60">Total Affiliates</div>
              <div className="text-2xl font-bold">{filteredAffiliates.length}</div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="p-3 bg-success/10 rounded-xl text-success">
              <Icon name="CheckCircle2" size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-base-content/60">Active</div>
              <div className="text-2xl font-bold">
                {filteredAffiliates.filter(u => (u.status || 'active') === 'active').length}
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-4 flex-row items-center gap-4">
            <div className="p-3 bg-error/10 rounded-xl text-error">
              <Icon name="Ban" size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-base-content/60">Suspended</div>
              <div className="text-2xl font-bold">
                {filteredAffiliates.filter(u => u.status === 'suspended').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <AffiliateTable
        users={filteredAffiliates}
        links={links}
        onToggleStatus={handleToggleStatus}
        onUpdateCommission={handleUpdateCommission}
      />
    </div>
  );
}