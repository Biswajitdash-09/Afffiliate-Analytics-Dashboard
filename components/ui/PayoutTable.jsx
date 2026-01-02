"use client";

import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/Icon";

const PayoutTable = ({ payouts, currentUserRole, onApprove, onReject }) => {
  const isAdmin = currentUserRole === "admin";

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <div className="badge badge-success gap-1.5 text-white py-2.5 pl-1.5 pr-3 shadow-sm shadow-success/20">
            <Icon name="CheckCircle" size={12} />
            <span className="font-medium capitalize">Paid</span>
          </div>
        );
      case "processing":
        return (
          <div className="badge badge-warning gap-1.5 text-warning-content py-2.5 pl-1.5 pr-3 shadow-sm shadow-warning/20">
            <Icon name="Clock" size={12} />
            <span className="font-medium capitalize">Pending</span>
          </div>
        );
      case "rejected":
        return (
          <div className="badge badge-error gap-1.5 text-white py-2.5 pl-1.5 pr-3 shadow-sm shadow-error/20">
            <Icon name="XCircle" size={12} />
            <span className="font-medium capitalize">Rejected</span>
          </div>
        );
      default:
        return <div className="badge badge-ghost">{status}</div>;
    }
  };

  if (!payouts || payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-base-100 rounded-2xl border border-base-200 border-dashed">
        <div className="bg-base-200 p-4 rounded-full mb-4">
          <Icon name="CreditCard" size={32} className="text-base-content/40" />
        </div>
        <h3 className="text-lg font-bold text-base-content">No Payouts Found</h3>
        <p className="text-base-content/60 max-w-xs mt-2">
          {isAdmin 
            ? "No payout requests have been made yet." 
            : "You haven't requested any payouts yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-base-100 rounded-2xl shadow-sm border border-base-200">
      <table className="table w-full">
        {/* Head */}
        <thead className="bg-base-200/50 text-xs uppercase font-bold text-base-content/60">
          <tr>
            <th className="py-4 pl-6">Date Requested</th>
            <th>Transaction ID</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Status</th>
            {isAdmin && <th className="text-right pr-6">Actions</th>}
          </tr>
        </thead>
        
        {/* Body */}
        <tbody className="text-sm">
          <AnimatePresence initial={false}>
            {payouts.map((payout, index) => (
              <motion.tr 
                key={payout.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="hover:bg-base-50 transition-colors border-b border-base-100 last:border-0"
              >
                {/* Date */}
                <td className="pl-6 py-4">
                  <div className="font-medium text-base-content">
                    {new Date(payout.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-base-content/50">
                    {new Date(payout.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </td>

                {/* ID */}
                <td>
                  <span className="font-mono text-xs bg-base-200 px-2 py-1 rounded text-base-content/70">
                    {payout.id}
                  </span>
                </td>

                {/* Method */}
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-base-content/60">
                      <Icon name="CreditCard" size={14} />
                    </div>
                    <span className="font-medium">{payout.method}</span>
                  </div>
                </td>

                {/* Amount */}
                <td>
                  <span className="font-bold text-base-content">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payout.amount)}
                  </span>
                </td>

                {/* Status */}
                <td>
                  {getStatusBadge(payout.status)}
                </td>

                {/* Admin Actions */}
                {isAdmin && (
                  <td className="text-right pr-6">
                    {payout.status === 'processing' ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="tooltip tooltip-left" data-tip="Approve">
                          <button 
                            onClick={() => onApprove(payout.id)}
                            className="btn btn-square btn-sm btn-success text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                          >
                            <Icon name="Check" size={16} />
                          </button>
                        </div>
                        <div className="tooltip tooltip-left" data-tip="Reject">
                          <button 
                            onClick={() => onReject(payout.id)}
                            className="btn btn-square btn-sm btn-error text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                          >
                            <Icon name="X" size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-base-content/40 italic">
                        {payout.status === 'completed' ? 'Approved' : 'Rejected'}
                      </span>
                    )}
                  </td>
                )}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
};

export default PayoutTable;