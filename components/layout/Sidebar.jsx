"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import usePersistentData from "@/hooks/usePersistentData";
import { useAuth } from "@/context/AuthContext";

const Sidebar = () => {
  const { currentUserId, logout } = useAuth();
  const { data, loading } = usePersistentData();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!loading && data?.users && currentUserId) {
      const user = data.users.find((u) => u.id === currentUserId);
      setCurrentUser(user);
    }
  }, [loading, data, currentUserId]);

  const isActive = (path) => pathname === path;

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "LayoutDashboard",
      roles: ["admin", "affiliate"]
    },
    {
      name: "Reports",
      path: "/reports",
      icon: "BarChart2",
      roles: ["admin", "affiliate"]
    },
    {
      name: "Affiliates",
      path: "/affiliates",
      icon: "Users",
      roles: ["admin"] // Only visible to admin
    },
    {
      name: "Audit Logs",
      path: "/admin/audit",
      icon: "ShieldAlert",
      roles: ["admin"]
    },
    {
      name: "Settings",
      path: "/settings",
      icon: "Settings",
      roles: ["admin", "affiliate"]
    }
  ];

  return (
    <div className="drawer-side z-40">
      <label htmlFor="app-drawer" aria-label="close sidebar" className="drawer-overlay"></label>

      <aside className="bg-base-100 min-h-screen w-72 border-r border-base-200 flex flex-col transition-all duration-300">
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-base-200 bg-base-100/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3 text-primary">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Icon name="Zap" size={24} className="text-primary" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-base-content">
              Affiliate<span className="text-primary">Pro</span>
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <ul className="menu menu-md gap-2">
            <li className="menu-title px-2 text-xs font-bold uppercase text-base-content/40 mb-1">
              Main Menu
            </li>

            {navItems.map((item) => {
              // Skip if user role doesn't match
              if (currentUser && !item.roles.includes(currentUser.role)) {
                return null;
              }

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
                      ${isActive(item.path)
                        ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                        : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                      }
                    `}
                  >
                    <Icon
                      name={item.icon}
                      size={20}
                      className={isActive(item.path) ? "text-primary-content" : "opacity-70"}
                    />
                    <span>{item.name}</span>

                    {/* Active Indicator Dot */}
                    {isActive(item.path) && (
                      <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Quick Stats Widget (Optional Visual Enhancement) */}
          {currentUser && (
            <div className="mt-8 mx-2 p-4 bg-base-200/50 rounded-2xl border border-base-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="avatar placeholder">
                  <div className="w-8 rounded-full bg-neutral text-neutral-content">
                    <span className="text-xs">{currentUser.name?.charAt(0)}</span>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">{currentUser.name}</p>
                  <p className="text-xs text-base-content/50 capitalize">{currentUser.role}</p>
                </div>
              </div>
              <div className="text-xs text-base-content/60 flex justify-between items-center">
                <span>Status</span>
                <span className="badge badge-xs badge-success gap-1 pl-1 pr-2 py-2">
                  <span className="w-1 h-1 bg-white rounded-full"></span>
                  Online
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-base-200 bg-base-50/50">
          <button
            onClick={() => {
              logout();
              // Redirect handled by AuthContext or router push if needed usually, 
              // but here just clearing state and Link probably redirects too if href is /
              // actually standard Link href="/" will navigate, but we should clear context first.
              // So I'll change Link to button with handler.
            }}
            className="btn btn-ghost btn-sm w-full justify-start gap-3 text-error hover:bg-error/10 hover:text-error"
          >
            <Icon name="LogOut" size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;