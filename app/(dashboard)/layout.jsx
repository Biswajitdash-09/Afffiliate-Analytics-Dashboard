"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import usePersistentData from "@/hooks/usePersistentData";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/");
      }
      setIsChecking(false);
    }
  }, [isLoading, isAuthenticated, router]);

  // Show a full-screen loading state while fetching data or verifying authentication
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-6">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="font-bold text-xl text-base-content tracking-tight">AffiliatePro</h3>
            <p className="text-sm text-base-content/50 animate-pulse">Verifying session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="drawer lg:drawer-open bg-base-200 min-h-screen font-sans">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col min-h-screen transition-all duration-300">
        {/* Header Component */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto w-full overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="footer footer-center p-4 text-base-content/40 text-sm mt-auto">
          <aside>
            <p>Copyright © {new Date().getFullYear()} - AffiliatePro Dashboard</p>
          </aside>
        </footer>
      </div>

      {/* Sidebar Component */}
      <Sidebar />
    </div>
  );
}