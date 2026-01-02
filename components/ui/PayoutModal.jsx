"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";

const PayoutModal = ({ isOpen, onClose, onRequest, maxAmount, availableMethods = ["Stripe", "PayPal", "Bank Transfer"] }) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(availableMethods[0]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(maxAmount > 0 ? maxAmount.toString() : "0");
      setMethod(availableMethods[0]);
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen, maxAmount, availableMethods]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than $0.");
      return;
    }

    if (numAmount > maxAmount) {
      setError(`Amount cannot exceed your available balance of $${maxAmount.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onRequest({ amount: numAmount, method });
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm bg-black/30 z-50">
      <div className="modal-box relative max-w-md bg-base-100 shadow-2xl border border-base-200 p-6 rounded-2xl animate-fade-in-up">
        <button 
          onClick={onClose} 
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          disabled={isSubmitting}
        >
          <Icon name="X" size={20} />
        </button>
        
        <h3 className="font-bold text-xl text-base-content mb-1">Request Payout</h3>
        <p className="text-sm text-base-content/60 mb-6">
          Withdraw your earnings to your preferred payment method.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Withdrawal Amount</span>
              <span className="label-text-alt text-primary font-medium">
                Max: ${maxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-base-content/50">$</span>
              </div>
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input input-bordered w-full pl-7 focus:input-primary font-mono text-lg" 
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Payment Method Select */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Payment Method</span>
            </label>
            <select 
              className="select select-bordered w-full focus:select-primary"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              disabled={isSubmitting}
            >
              {availableMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error py-2 text-sm shadow-sm rounded-lg">
              <Icon name="AlertCircle" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="modal-action mt-8">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary min-w-[120px]"
              disabled={isSubmitting || maxAmount <= 0}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Processing...
                </>
              ) : (
                <>
                  Request Payout
                  <Icon name="ArrowRight" size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayoutModal;