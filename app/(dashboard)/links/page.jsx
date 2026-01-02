"use client";

import { useState, useEffect, useMemo } from "react";
import usePersistentData from "@/hooks/usePersistentData";
import { useAuth } from "@/context/AuthContext";
import LinkTable from "@/components/ui/LinkTable";
import LinkModal from "@/components/ui/LinkModal";
import Icon from "@/components/Icon";

export default function LinksPage() {
  const { data, loading, error, saveData } = usePersistentData();
  const { currentUserId } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Initialize user
  useEffect(() => {
    if (!loading && data?.users && currentUserId) {
      const user = data.users.find((u) => u.id === currentUserId);
      setCurrentUser(user || data.users[0]);
    }
  }, [loading, data, currentUserId]);

  // Filter links based on role, search, and status
  const filteredLinks = useMemo(() => {
    if (!data?.links || !currentUser) return [];

    let links = data.links;

    // Role-based filtering
    if (currentUser.role === "affiliate") {
      links = links.filter(link => link.affiliateId === currentUser.id);
    }
    // Admins see all links (implied)

    // Search filtering
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      links = links.filter(link =>
        link.name.toLowerCase().includes(lowerTerm) ||
        link.slug.toLowerCase().includes(lowerTerm) ||
        link.url.toLowerCase().includes(lowerTerm)
      );
    }

    // Status filtering
    if (filterStatus !== "all") {
      links = links.filter(link => link.status === filterStatus);
    }

    // Sort by newest first
    return links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data, currentUser, searchTerm, filterStatus]);

  // Handlers
  const handleCreateClick = () => {
    setEditingLink(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (link) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (linkId) => {
    if (window.confirm("Are you sure you want to delete this link? This action cannot be undone.")) {
      const updatedLinks = data.links.filter(l => l.id !== linkId);
      await saveData({ ...data, links: updatedLinks });
    }
  };

  const handleSaveLink = async (formData) => {
    let updatedLinks = [...data.links];

    if (editingLink) {
      // Update existing link
      updatedLinks = updatedLinks.map(link =>
        link.id === editingLink.id
          ? { ...link, ...formData }
          : link
      );
    } else {
      // Create new link
      const newLink = {
        id: `lnk_${Date.now().toString(36)}`,
        affiliateId: currentUser.id,
        ...formData,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        createdAt: new Date().toISOString(),
      };
      updatedLinks.push(newLink);
    }

    const success = await saveData({ ...data, links: updatedLinks });
    if (success) {
      setIsModalOpen(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/50 mt-4 animate-pulse">Loading your campaigns...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="alert alert-error shadow-lg max-w-2xl mx-auto mt-10">
        <Icon name="AlertTriangle" />
        <span>Error loading data: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Link Manager</h2>
          <p className="text-base-content/60 text-sm">
            Create, track, and manage your affiliate marketing campaigns.
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="btn btn-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
        >
          <Icon name="Plus" size={20} />
          Create New Link
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-4 flex flex-col md:flex-row gap-4 items-center justify-between">

          {/* Search */}
          <div className="relative w-full md:max-w-md">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search campaigns, slugs, or URLs..."
              className="input input-bordered w-full pl-10 focus:input-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <div className="join">
              <button
                className={`join-item btn btn-sm ${filterStatus === 'all' ? 'btn-active btn-neutral' : 'btn-ghost bg-base-200/50'}`}
                onClick={() => setFilterStatus('all')}
              >
                All
              </button>
              <button
                className={`join-item btn btn-sm ${filterStatus === 'active' ? 'btn-active btn-success text-white' : 'btn-ghost bg-base-200/50'}`}
                onClick={() => setFilterStatus('active')}
              >
                Active
              </button>
              <button
                className={`join-item btn btn-sm ${filterStatus === 'inactive' ? 'btn-active btn-ghost border-base-300' : 'btn-ghost bg-base-200/50'}`}
                onClick={() => setFilterStatus('inactive')}
              >
                Inactive
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Stats Summary (Optional Enhancement) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl py-4">
          <div className="stat-figure text-primary bg-primary/10 p-2 rounded-xl">
            <Icon name="Link" size={20} />
          </div>
          <div className="stat-title text-xs font-medium opacity-60">Total Links</div>
          <div className="stat-value text-2xl">{filteredLinks.length}</div>
        </div>

        <div className="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl py-4">
          <div className="stat-figure text-success bg-success/10 p-2 rounded-xl">
            <Icon name="MousePointer2" size={20} />
          </div>
          <div className="stat-title text-xs font-medium opacity-60">Total Clicks</div>
          <div className="stat-value text-2xl">
            {filteredLinks.reduce((sum, l) => sum + (l.clicks || 0), 0).toLocaleString()}
          </div>
        </div>

        <div className="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl py-4">
          <div className="stat-figure text-secondary bg-secondary/10 p-2 rounded-xl">
            <Icon name="DollarSign" size={20} />
          </div>
          <div className="stat-title text-xs font-medium opacity-60">Total Revenue</div>
          <div className="stat-value text-2xl">
            ${filteredLinks.reduce((sum, l) => sum + (l.revenue || 0), 0).toLocaleString()}
          </div>
        </div>

        <div className="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl py-4">
          <div className="stat-figure text-warning bg-warning/10 p-2 rounded-xl">
            <Icon name="Activity" size={20} />
          </div>
          <div className="stat-title text-xs font-medium opacity-60">Avg. Conv. Rate</div>
          <div className="stat-value text-2xl">
            {(() => {
              const totalClicks = filteredLinks.reduce((sum, l) => sum + (l.clicks || 0), 0);
              const totalConv = filteredLinks.reduce((sum, l) => sum + (l.conversions || 0), 0);
              return totalClicks > 0 ? ((totalConv / totalClicks) * 100).toFixed(1) + "%" : "0%";
            })()}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <LinkTable
        links={filteredLinks}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        currentUserRole={currentUser?.role}
      />

      {/* Modal */}
      <LinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLink}
        initialData={editingLink}
        currentUser={currentUser}
      />
    </div>
  );
}