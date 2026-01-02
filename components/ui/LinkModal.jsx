"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";

const LinkModal = ({ isOpen, onClose, onSave, initialData, currentUser }) => {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    url: "",
    commissionRate: "",
    clicks: 0,
    conversions: 0,
    revenue: 0,
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or populate form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          slug: initialData.slug || "",
          url: initialData.url || "",
          commissionRate: initialData.commissionRate || "",
          clicks: initialData.clicks || 0,
          conversions: initialData.conversions || 0,
          revenue: initialData.revenue || 0,
          status: initialData.status || "active",
        });
      } else {
        setFormData({
          name: "",
          slug: "",
          url: "",
          commissionRate: "",
          clicks: 0,
          conversions: 0,
          revenue: 0,
          status: "active",
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Auto-generate slug from name if slug is empty
  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !initialData && !prev.slugDirty ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : prev.slug
    }));
  };

  const handleSlugChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      slugDirty: true
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Campaign name is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.url.trim()) newErrors.url = "Target URL is required";
    else if (!/^https?:\/\//.test(formData.url)) newErrors.url = "URL must start with http:// or https://";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 600));

    onSave(formData);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="modal-box w-full max-w-lg bg-base-100 shadow-2xl border border-base-200 p-0 overflow-hidden transform transition-all duration-300 scale-100">

        {/* Header */}
        <div className="bg-base-200/50 px-6 py-4 border-b border-base-200 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Icon name={initialData ? "Edit" : "PlusCircle"} className="text-primary" size={20} />
            {initialData ? "Edit Campaign" : "Create New Link"}
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost hover:bg-base-300 transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Name Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Campaign Name</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Summer Sale 2024"
              className={`input input-bordered w-full focus:input-primary transition-all ${errors.name ? "input-error" : ""}`}
              value={formData.name}
              onChange={handleNameChange}
            />
            {errors.name && <span className="text-error text-xs mt-1 ml-1">{errors.name}</span>}
          </div>

          {/* Slug Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">URL Slug</span>
              <span className="label-text-alt text-base-content/50">Unique identifier</span>
            </label>
            <div className="join w-full">
              <span className="btn btn-disabled join-item bg-base-200 border-base-300 text-base-content/50 px-3 font-normal normal-case">
                /r/
              </span>
              <input
                type="text"
                placeholder="summer-sale"
                className={`input input-bordered join-item w-full focus:input-primary transition-all ${errors.slug ? "input-error" : ""}`}
                value={formData.slug}
                onChange={handleSlugChange}
              />
            </div>
            {errors.slug && <span className="text-error text-xs mt-1 ml-1">{errors.slug}</span>}
          </div>

          {/* Target URL Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Destination URL</span>
            </label>
            <div className="relative">
              <Icon name="Link" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="url"
                placeholder="https://yourstore.com/product"
                className={`input input-bordered w-full pl-10 focus:input-primary transition-all ${errors.url ? "input-error" : ""}`}
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            {errors.url && <span className="text-error text-xs mt-1 ml-1">{errors.url}</span>}
            <div className="text-xs text-base-content/50 mt-2 flex items-start gap-1">
              <Icon name="Info" size={12} className="mt-0.5 shrink-0" />
              <span>This is where users will be redirected after clicking your tracking link.</span>
            </div>
          </div>

          {/* Commission Override Input */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">Commission Rate (Override)</span>
              <span className="label-text-alt text-base-content/50">Optional</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="Default (10%)"
                className="input input-bordered w-full pr-10 focus:input-primary"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                min="0"
                max="100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 font-bold">%</span>
            </div>
            <label className="label">
              <span className="label-text-alt text-base-content/50">Leave empty to use affiliate's default rate.</span>
            </label>
          </div>

          {/* Admin Override: Metrics Manual Adjustment */}
          {currentUser?.role === 'admin' && initialData && (
            <div className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-box">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium text-warning flex items-center gap-2">
                <Icon name="AlertTriangle" size={14} />
                Manual Data Adjustment
              </div>
              <div className="collapse-content space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text text-xs">Clicks</span></label>
                    <input
                      type="number"
                      className="input input-bordered input-sm w-full"
                      value={formData.clicks}
                      onChange={(e) => setFormData({ ...formData, clicks: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-xs">Conversions</span></label>
                    <input
                      type="number"
                      className="input input-bordered input-sm w-full"
                      value={formData.conversions}
                      onChange={(e) => setFormData({ ...formData, conversions: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-xs">Revenue ($)</span></label>
                    <input
                      type="number"
                      className="input input-bordered input-sm w-full"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <p className="text-xs text-error">Warning: Changing these values directly affects affiliate payouts.</p>
              </div>
            </div>
          )}

          {/* Status Toggle */}
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <span className="label-text font-medium">Active Status</span>
              <input
                type="checkbox"
                className="toggle toggle-success toggle-sm"
                checked={formData.status === "active"}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked ? "active" : "inactive" })}
              />
              <span className={`badge badge-sm ${formData.status === "active" ? "badge-success text-white" : "badge-ghost"}`}>
                {formData.status === "active" ? "Active" : "Inactive"}
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="modal-action mt-8 pt-4 border-t border-base-200">
            <button
              type="button"
              className="btn btn-ghost hover:bg-base-200"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary min-w-[120px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="Save" size={18} />
                  {initialData ? "Update Link" : "Create Link"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkModal;