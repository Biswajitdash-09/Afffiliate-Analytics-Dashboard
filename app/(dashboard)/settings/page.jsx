"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import usePersistentData from "@/hooks/usePersistentData";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Icon from "@/components/Icon";

export default function SettingsPage() {
  const router = useRouter();
  const { data, loading, error, saveData, resetData } = usePersistentData();
  const { currentUserId } = useAuth();
  const { theme, changeTheme } = useTheme();

  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatar: "",
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
    theme: "light"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Initialize user data
  useEffect(() => {
    if (!loading && data?.users && currentUserId) {
      const user = data.users.find((u) => u.id === currentUserId);

      if (user) {
        setCurrentUser(user);
        setFormData({
          name: user.name || "",
          email: user.email || "",
          avatar: user.avatar || "",
        });

        // Load theme from Context
        setPreferences(prev => ({ ...prev, theme: theme }));
      }
    }
  }, [loading, data, currentUserId, theme]);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Preference Changes
  const handlePrefChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));

    if (key === 'theme') {
      // Apply theme via Context
      changeTheme(value);
    }
  };

  // Save Profile Changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // 1. Update User in Data
      const updatedUsers = data.users.map(u =>
        u.id === currentUser.id
          ? { ...u, ...formData }
          : u
      );

      // 2. Save to Persistent Storage
      const success = await saveData({ ...data, users: updatedUsers });

      if (success) {
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update local state
        setCurrentUser({ ...currentUser, ...formData });
      } else {
        throw new Error("Failed to save data");
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Handle Reset Data
  const handleReset = async () => {
    if (window.confirm("Are you sure? This will reset all data to the initial demo state. All created links and changes will be lost.")) {
      await resetData();
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-base-content">Settings</h2>
        <p className="text-base-content/60 text-sm">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Navigation/Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body items-center text-center p-6">
              <div className="avatar placeholder mb-2">
                <div className="bg-neutral text-neutral-content rounded-full w-24 ring ring-primary ring-offset-base-100 ring-offset-2">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" />
                  ) : (
                    <span className="text-3xl font-bold bg-primary text-primary-content h-full w-full flex items-center justify-center">
                      {formData.name?.charAt(0) || <Icon name="User" size={32} />}
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-lg">{formData.name}</h3>
              <p className="text-sm text-base-content/60">{currentUser.role === 'admin' ? 'Merchant Admin' : 'Affiliate Partner'}</p>
              <div className="badge badge-ghost mt-2 font-mono text-xs">{currentUser.id}</div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="menu bg-base-100 rounded-box border border-base-200 shadow-sm">
            <li>
              <a className="active font-medium">
                <Icon name="User" size={18} />
                General Profile
              </a>
            </li>
            <li>
              <a className="text-base-content/70">
                <Icon name="Bell" size={18} />
                Notifications
              </a>
            </li>
            <li>
              <a className="text-base-content/70">
                <Icon name="Lock" size={18} />
                Security
              </a>
            </li>
            <li>
              <a className="text-base-content/70">
                <Icon name="CreditCard" size={18} />
                Billing Methods
              </a>
            </li>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">

          {/* General Settings Form */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h3 className="card-title text-lg mb-4">Profile Information</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Full Name</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input input-bordered w-full focus:input-primary"
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Email Address</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input input-bordered w-full focus:input-primary"
                      required
                    />
                  </div>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Avatar URL</span>
                  </label>
                  <div className="join w-full">
                    <div className="bg-base-200 join-item flex items-center px-3 border border-base-300 border-r-0">
                      <Icon name="Image" size={18} className="opacity-50" />
                    </div>
                    <input
                      type="text"
                      name="avatar"
                      value={formData.avatar}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="input input-bordered join-item w-full focus:input-primary"
                    />
                  </div>
                  <label className="label">
                    <span className="label-text-alt text-base-content/50">Leave empty to use generated initials</span>
                  </label>
                </div>

                {/* Save Message Alert */}
                {saveMessage && (
                  <div className={`alert ${saveMessage.type === 'success' ? 'alert-success' : 'alert-error'} py-2 text-sm shadow-sm`}>
                    <Icon name={saveMessage.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size={18} />
                    <span>{saveMessage.text}</span>
                  </div>
                )}

                <div className="card-actions justify-end mt-4">
                  <button
                    type="submit"
                    className={`btn btn-primary ${isSaving ? 'loading' : ''}`}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h3 className="card-title text-lg mb-4">Appearance</h3>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <span className="label-text font-medium w-32">Interface Theme</span>
                  <select
                    className="select select-bordered select-sm w-full max-w-xs"
                    value={preferences.theme}
                    onChange={(e) => handlePrefChange('theme', e.target.value)}
                  >
                    <option value="light">Light (Default)</option>
                    <option value="dark">Dark</option>
                    <option value="cupcake">Cupcake</option>
                    <option value="bumblebee">Bumblebee</option>
                    <option value="emerald">Emerald</option>
                    <option value="corporate">Corporate</option>
                    <option value="synthwave">Synthwave</option>
                    <option value="retro">Retro</option>
                    <option value="cyberpunk">Cyberpunk</option>
                    <option value="valentine">Valentine</option>
                    <option value="halloween">Halloween</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card bg-base-100 shadow-sm border border-error/20">
            <div className="card-body p-6">
              <h3 className="card-title text-lg text-error mb-2">Danger Zone</h3>
              <p className="text-sm text-base-content/60 mb-4">
                Resetting the application will revert all data (users, links, analytics) back to the initial seed data.
                This action cannot be undone.
              </p>

              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="btn btn-outline btn-error btn-sm gap-2"
                >
                  <Icon name="RefreshCcw" size={16} />
                  Reset Application Data
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}