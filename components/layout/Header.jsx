"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import usePersistentData from "@/hooks/usePersistentData";
import { useAuth } from "@/context/AuthContext";

const Header = () => {
  const router = useRouter();
  const { currentUserId, login, logout } = useAuth();
  const { data, loading } = usePersistentData();
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user based on AuthContext
  useEffect(() => {
    if (!loading && data?.users && currentUserId) {
      const user = data.users.find((u) => u.id === currentUserId);
      setCurrentUser(user || null);
    }
  }, [loading, data, currentUserId]);

  // Toggle between Admin and Affiliate roles for demo purposes
  const handleRoleToggle = () => {
    if (!data?.users || !currentUser) return;

    const targetRole = currentUser.role === "admin" ? "affiliate" : "admin";
    // Find the first user of the target role
    const targetUser = data.users.find((u) => u.role === targetRole);

    if (targetUser) {
      login(targetUser.id);
      router.push("/dashboard"); // Ensure we are on dashboard
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="navbar bg-base-100 h-16 border-b border-base-200 px-4 sm:px-6 animate-pulse">
        <div className="flex-1">
          <div className="h-6 w-32 bg-base-300 rounded"></div>
        </div>
        <div className="flex-none gap-4">
          <div className="h-8 w-24 bg-base-300 rounded-full"></div>
          <div className="h-10 w-10 bg-base-300 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="navbar bg-base-100 sticky top-0 z-30 shadow-sm border-b border-base-200 px-4 sm:px-6 backdrop-blur-lg bg-opacity-90">
      {/* Mobile Menu Toggle */}
      <div className="flex-none lg:hidden mr-2">
        <label
          htmlFor="app-drawer"
          aria-label="open sidebar"
          className="btn btn-square btn-ghost hover:bg-base-200"
        >
          <Icon name="Menu" size={24} />
        </label>
      </div>

      {/* Page Title / Breadcrumb */}
      <div className="flex-1">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-base-content leading-tight hidden sm:block">
            {currentUser?.role === 'admin' ? 'Merchant Overview' : 'Affiliate Dashboard'}
          </h1>
          <span className="text-xs text-base-content/50 hidden sm:block">
            Welcome back, {currentUser?.name?.split(' ')[0]}
          </span>
          {/* Mobile Title */}
          <span className="text-lg font-bold sm:hidden">AffiliatePro</span>
        </div>
      </div>

      <div className="flex-none gap-3 sm:gap-4">
        {/* Role Toggle Button (Demo Feature) */}
        <button
          onClick={handleRoleToggle}
          className="btn btn-sm btn-ghost gap-2 hidden md:flex font-normal border border-base-300 hover:border-primary/50 hover:bg-primary/5"
          title={`Switch to ${currentUser?.role === 'admin' ? 'Affiliate' : 'Admin'} View`}
        >
          <Icon name="RefreshCw" size={14} className="text-base-content/60" />
          <span className="text-xs text-base-content/70">
            View as {currentUser?.role === 'admin' ? 'Affiliate' : 'Merchant'}
          </span>
        </button>

        {/* Notifications */}
        <button className="btn btn-ghost btn-circle btn-sm">
          <div className="indicator">
            <Icon name="Bell" size={20} className="text-base-content/70" />
            <span className="badge badge-xs badge-primary indicator-item"></span>
          </div>
        </button>

        {/* User Profile Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar placeholder ring-2 ring-base-200 ring-offset-2 ring-offset-base-100 hover:ring-primary transition-all duration-300"
          >
            <div className="w-9 rounded-full bg-neutral text-neutral-content">
              {currentUser?.avatar ? (
                <img alt={currentUser.name} src={currentUser.avatar} />
              ) : (
                <span className="text-lg font-bold bg-primary text-primary-content h-full w-full flex items-center justify-center">
                  {currentUser?.name?.charAt(0) || "U"}
                </span>
              )}
            </div>
          </div>
          <ul
            tabIndex={0}
            className="mt-3 z-1 p-2 shadow-xl menu menu-sm dropdown-content bg-base-100 rounded-box w-64 border border-base-200"
          >
            <li className="menu-title px-4 py-3 bg-base-200/50 rounded-t-lg -mx-2 -mt-2 mb-2 border-b border-base-200">
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  <div className="w-10 rounded-full bg-neutral text-neutral-content">
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="avatar" />
                    ) : (
                      <span className="text-xl font-bold bg-primary text-primary-content h-full w-full flex items-center justify-center">
                        {currentUser?.name?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-base-content">{currentUser?.name}</div>
                  <div className="text-xs font-normal opacity-70 capitalize badge badge-ghost badge-sm mt-1">
                    {currentUser?.role}
                  </div>
                </div>
              </div>
            </li>

            <li>
              <Link href="/settings" className="py-3">
                <Icon name="User" size={16} />
                Profile Settings
              </Link>
            </li>
            <li>
              <a onClick={handleRoleToggle} className="py-3">
                <Icon name="RefreshCw" size={16} />
                Switch Role
              </a>
            </li>
            <div className="divider my-1"></div>
            <li>
              <a onClick={handleLogout} className="py-3 text-error hover:bg-error/10">
                <Icon name="LogOut" size={16} />
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;