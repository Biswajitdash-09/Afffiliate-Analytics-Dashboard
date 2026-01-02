"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import usePersistentData from "@/hooks/usePersistentData";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/Icon";

export default function AuditLogsPage() {
    const router = useRouter();
    const { currentUserId } = useAuth();
    const { data, loading, error } = usePersistentData();
    const [logs, setLogs] = useState([]);

    // Authorization Check
    useEffect(() => {
        if (!loading && data?.users && currentUserId) {
            const user = data.users.find((u) => u.id === currentUserId);
            if (!user || user.role !== "admin") {
                router.push("/dashboard");
            }
        }
    }, [loading, data, currentUserId, router]);

    // Load mocks (since we don't have real logs in data.json yet)
    useEffect(() => {
        // Simulated logs for demo
        setLogs([
            {
                id: 1,
                action: "UPDATE_COMMISSION",
                admin: "Admin User",
                target: "John Doe",
                details: "Changed rate from 10% to 15%",
                date: new Date().toISOString(),
                ip: "192.168.1.1"
            },
            {
                id: 2,
                action: "SUSPEND_USER",
                admin: "Admin User",
                target: "Spam Bot",
                details: "Reason: Fraudulent traffic",
                date: new Date(Date.now() - 86400000).toISOString(),
                ip: "192.168.1.1"
            }
        ]);
    }, []);

    if (loading) return <div className="p-8"><span className="loading loading-spinner"></span></div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-base-content">Audit Logs</h2>
                <p className="text-base-content/60">System security events and administrative actions.</p>
            </div>

            <div className="overflow-x-auto bg-base-100 rounded-box border border-base-200 shadow-sm">
                <table className="table w-full">
                    <thead className="bg-base-200/50">
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>Admin</th>
                            <th>Target</th>
                            <th>Details</th>
                            <th>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-base-50">
                                <td className="font-mono text-xs opacity-70">
                                    {new Date(log.date).toLocaleString()}
                                </td>
                                <td>
                                    <span className={`badge badge-sm font-mono ${log.action.includes("SUSPEND") ? "badge-error text-white" : "badge-ghost"
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="font-medium">{log.admin}</td>
                                <td>{log.target}</td>
                                <td className="text-sm opacity-80">{log.details}</td>
                                <td className="font-mono text-xs opacity-50">{log.ip}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
