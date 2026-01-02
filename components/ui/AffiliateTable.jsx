"use client";

import { useMemo } from "react";
import Icon from "@/components/Icon";

const AffiliateTable = ({ users, links, onToggleStatus, onUpdateCommission }) => {
  // Calculate revenue for each user based on their links
  const usersWithRevenue = useMemo(() => {
    return users.map((user) => {
      const userRevenue = links
        .filter((link) => link.affiliateId === user.id)
        .reduce((sum, link) => sum + (link.revenue || 0), 0);

      return {
        ...user,
        totalRevenue: userRevenue,
        commissionRate: user.commissionRate || 10, // Default 10%
        status: user.status || 'active'
      };
    });
  }, [users, links]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-base-100 rounded-box border border-base-200 text-center">
        <div className="bg-base-200 p-4 rounded-full mb-4">
          <Icon name="Users" size={32} className="text-base-content/40" />
        </div>
        <h3 className="text-lg font-bold text-base-content">No Affiliates Found</h3>
        <p className="text-base-content/60 max-w-xs mt-2">
          There are no affiliate accounts matching your criteria currently in the system.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-base-100 rounded-box border border-base-200 shadow-sm">
      <table className="table w-full">
        {/* Table Head */}
        <thead className="bg-base-200/50 text-xs uppercase font-bold text-base-content/60">
          <tr>
            <th className="py-4 pl-6">Affiliate</th>
            <th>Status</th>
            <th>Joined Date</th>
            <th className="text-center">Commission</th>
            <th className="text-right">Total Revenue</th>
            <th className="text-right pr-6">Actions</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {usersWithRevenue.map((user) => (
            <tr key={user.id} className="hover:bg-base-50 transition-colors group">
              <td className="pl-6">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="mask mask-squircle w-10 h-10 bg-neutral text-neutral-content">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <span className="text-lg font-bold bg-primary/10 text-primary">
                          {user.name?.charAt(0) || "A"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-base-content">{user.name}</div>
                    <div className="text-xs text-base-content/50 font-mono">{user.email}</div>
                  </div>
                </div>
              </td>

              <td>
                <div className={`badge badge-sm gap-1 ${user.status === 'active'
                    ? 'badge-success text-white'
                    : user.status === 'pending'
                      ? 'badge-warning text-warning-content'
                      : 'badge-error text-white'
                  }`}>
                  {user.status === 'active' ? (
                    <Icon name="CheckCircle2" size={12} />
                  ) : user.status === 'pending' ? (
                    <Icon name="Clock" size={12} />
                  ) : (
                    <Icon name="Ban" size={12} />
                  )}
                  <span className="capitalize">{user.status}</span>
                </div>
              </td>

              <td className="text-sm text-base-content/70">
                {formatDate(user.joinedAt)}
              </td>

              <td className="text-center">
                <button
                  className="btn btn-xs btn-ghost gap-1 hover:bg-base-200"
                  onClick={() => {
                    const newRate = prompt("Enter new commission rate (%):", user.commissionRate);
                    if (newRate !== null && !isNaN(newRate)) {
                      onUpdateCommission(user.id, parseFloat(newRate));
                    }
                  }}
                >
                  <span className="font-mono font-bold">{user.commissionRate}%</span>
                  <Icon name="Edit2" size={10} className="opacity-50" />
                </button>
              </td>

              <td className="text-right font-mono font-medium text-base-content">
                {formatCurrency(user.totalRevenue)}
              </td>

              <td className="text-right pr-6">
                <button
                  onClick={() => onToggleStatus(user.id, user.status)}
                  className={`btn btn-sm btn-ghost border border-base-300 hover:border-base-content/20 gap-2 transition-all ${user.status === 'active'
                      ? 'text-error hover:bg-error/10'
                      : 'text-success hover:bg-success/10'
                    }`}
                  title={user.status === 'active' ? "Suspend Account" : "Activate Account"}
                >
                  <Icon
                    name={user.status === 'active' ? "Ban" : "CheckCircle"}
                    size={16}
                  />
                  <span className="hidden sm:inline">
                    {user.status === 'active' ? "Suspend" : "Activate"}
                  </span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AffiliateTable;