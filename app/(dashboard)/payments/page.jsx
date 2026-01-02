"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import PayoutTable from "@/components/ui/PayoutTable";
import PayoutModal from "@/components/ui/PayoutModal";
import Icon from "@/components/Icon";

export default function PaymentsPage() {
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const [payouts, setPayouts] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/payouts');
        if (!res.ok) throw new Error("Failed to fetch payout data");
        const data = await res.json();

        setPayouts(data.payouts);
        setAvailableBalance(data.availableBalance || 0);
      } catch (err) {
        console.error("Payments Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchData();
    }
  }, [isAuthenticated, authLoading]);

  // Computed Stats
  const totalWithdrawn = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingAmount = payouts
    .filter(p => p.status === 'processing' || p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const filteredPayouts = payouts
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Handlers
  const handleRequestPayout = async ({ amount, method }) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), method })
      });

      if (!res.ok) throw new Error("Request failed");
      const newPayout = await res.json();

      setPayouts([newPayout, ...payouts]);
      setAvailableBalance(prev => prev - parseFloat(amount)); // Optimistic update
      setIsModalOpen(false);

    } catch (err) {
      console.error("Payout Request Error:", err);
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusUpdate = async (payoutId, newStatus) => {
    if (currentUser?.role !== 'admin' || isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/payouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payoutId, status: newStatus })
      });

      if (!res.ok) throw new Error("Update failed");

      setPayouts(payouts.map(p => p._id === payoutId ? { ...p, status: newStatus } : p));

      // Note: If rejected, balance should technically go back up, but we'd need to refetch to be accurate or calculate locally.
      // For simplicity in MVP, we might want to refetch or just let the user refresh.
      if (newStatus === 'rejected') {
        // Optionally refetch
        // fetchData();
      }

    } catch (err) {
      console.error("Status Update Error:", err);
      alert("Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };


  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/50 mt-4 animate-pulse">Loading financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg max-w-2xl mx-auto mt-10">
        <Icon name="AlertTriangle" />
        <span>Error loading payments: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Payments & Payouts</h2>
          <p className="text-base-content/60 text-sm">
            {currentUser?.role === 'admin'
              ? 'Manage payout requests and view transaction history.'
              : 'Track your earnings and request withdrawals.'}
          </p>
        </div>

        {currentUser?.role === 'affiliate' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
            disabled={availableBalance <= 0}
          >
            <Icon name="DollarSign" size={20} />
            Request Payout
          </button>
        )}
      </div>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <div className="card bg-linear-to-br from-primary/90 to-primary text-primary-content shadow-xl">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium opacity-90">Available Balance</h3>
              <div className="bg-white/20 p-2 rounded-lg">
                <Icon name="Wallet" size={20} className="text-white" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(availableBalance)}
              </span>
            </div>
            <div className="mt-2 text-xs opacity-75">
              Ready to withdraw
            </div>
          </div>
        </div>

        {/* Pending Processing */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-base-content/70">Pending Processing</h3>
              <div className="bg-warning/10 p-2 rounded-lg text-warning">
                <Icon name="Clock" size={20} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-base-content">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(pendingAmount)}
              </span>
            </div>
            <div className="mt-2 text-xs text-base-content/50">
              In review
            </div>
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-base-content/70">Total Withdrawn</h3>
              <div className="bg-success/10 p-2 rounded-lg text-success">
                <Icon name="CheckCircle" size={20} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-base-content">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalWithdrawn)}
              </span>
            </div>
            <div className="mt-2 text-xs text-base-content/50">
              Lifetime earnings paid
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Transaction History</h3>

          <div className="join">
            <button
              className={`join-item btn btn-sm ${filterStatus === 'all' ? 'btn-active btn-neutral' : 'btn-ghost bg-base-200/50'}`}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button
              className={`join-item btn btn-sm ${filterStatus === 'processing' || filterStatus === 'pending' ? 'btn-active btn-warning text-warning-content' : 'btn-ghost bg-base-200/50'}`}
              onClick={() => setFilterStatus('pending')} // Simplification for UI filter
            >
              Pending
            </button>
            <button
              className={`join-item btn btn-sm ${filterStatus === 'completed' ? 'btn-active btn-success text-white' : 'btn-ghost bg-base-200/50'}`}
              onClick={() => setFilterStatus('completed')}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Note: Map _id to id for component compatibility if needed, or update component */}
        <PayoutTable
          payouts={filteredPayouts.map(p => ({ ...p, id: p._id }))}
          currentUserRole={currentUser?.role}
          onApprove={(id) => handleStatusUpdate(id, 'completed')}
          onReject={(id) => handleStatusUpdate(id, 'rejected')}
        />
      </div>

      <PayoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRequest={handleRequestPayout}
        maxAmount={availableBalance}
      />
    </div>
  );
}