"use client";

import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/Icon";

const LinkTable = ({ links, onEdit, onDelete, currentUserRole }) => {
  // Helper for status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <div className="badge badge-success text-white gap-1.5 pl-1.5 pr-3 py-2.5 shadow-sm shadow-success/20">
            <Icon name="CheckCircle" size={12} /> 
            <span className="font-medium">Active</span>
          </div>
        );
      case "inactive":
        return (
          <div className="badge badge-ghost gap-1.5 pl-1.5 pr-3 py-2.5 border-base-300">
            <Icon name="PauseCircle" size={12} /> 
            <span className="font-medium">Inactive</span>
          </div>
        );
      default:
        return <div className="badge badge-ghost">{status}</div>;
    }
  };

  // Helper for currency
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // Copy to clipboard
  const copyToClipboard = (text) => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      // In a real app, you would trigger a toast notification here
    }
  };

  if (!links || links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-base-100 rounded-2xl border border-base-200 border-dashed">
        <div className="bg-base-200 p-4 rounded-full mb-4">
          <Icon name="Link2Off" size={32} className="text-base-content/40" />
        </div>
        <h3 className="text-lg font-bold text-base-content">No Campaigns Found</h3>
        <p className="text-base-content/60 max-w-xs mt-2">
          Get started by creating your first affiliate link to track performance.
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
            <th className="py-4 pl-6">Campaign Info</th>
            <th>Target URL</th>
            <th className="text-center">Clicks</th>
            <th className="text-center">Conversions</th>
            <th className="text-right">Revenue</th>
            <th className="text-center">Status</th>
            <th className="text-right pr-6">Actions</th>
          </tr>
        </thead>
        
        {/* Body */}
        <tbody className="text-sm">
          <AnimatePresence initial={false}>
            {links.map((link, index) => (
              <motion.tr 
                key={link.id}
                layout // Animates layout changes (sorting/reordering)
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }} // Staggered effect
                className="hover:bg-base-50 transition-colors border-b border-base-100 last:border-0 group"
              >
                {/* Campaign Info */}
                <td className="pl-6 py-4 max-w-[200px] sm:max-w-[250px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon name="Link" size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-base-content truncate" title={link.name}>{link.name}</div>
                      <div className="text-xs text-base-content/50 font-mono truncate" title={link.slug}>/{link.slug}</div>
                    </div>
                  </div>
                </td>

                {/* Target URL */}
                <td className="max-w-[150px] sm:max-w-[200px]">
                  <div 
                    className="flex items-center gap-2 group/url cursor-pointer" 
                    onClick={() => copyToClipboard(link.url)}
                  >
                    <span className="truncate text-base-content/70 text-xs font-mono bg-base-200 px-2 py-1 rounded hover:bg-base-300 transition-colors" title={link.url}>
                      {link.url}
                    </span>
                    <button className="btn btn-ghost btn-xs btn-square opacity-0 group-hover/url:opacity-100 transition-opacity" aria-label="Copy URL">
                      <Icon name="Copy" size={12} />
                    </button>
                  </div>
                </td>

                {/* Clicks */}
                <td className="text-center font-mono text-base-content/80">
                  {link.clicks?.toLocaleString() || 0}
                </td>

                {/* Conversions */}
                <td className="text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-base-content/80">{link.conversions?.toLocaleString() || 0}</span>
                    <span className="text-[10px] text-base-content/40">
                      {link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </td>

                {/* Revenue */}
                <td className="text-right font-bold text-base-content">
                  {formatCurrency(link.revenue || 0)}
                </td>

                {/* Status */}
                <td className="text-center">
                  {getStatusBadge(link.status)}
                </td>

                {/* Actions */}
                <td className="text-right pr-6">
                  <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <div className="tooltip tooltip-left" data-tip="Edit Campaign">
                      <button 
                        onClick={() => onEdit(link)}
                        className="btn btn-square btn-sm btn-ghost hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Icon name="Edit2" size={16} />
                      </button>
                    </div>
                    <div className="tooltip tooltip-left" data-tip="Delete">
                      <button 
                        onClick={() => onDelete(link.id)}
                        className="btn btn-square btn-sm btn-ghost hover:bg-error/10 hover:text-error transition-colors"
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
};

export default LinkTable;