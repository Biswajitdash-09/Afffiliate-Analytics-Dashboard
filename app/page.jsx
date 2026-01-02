"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Icon from "@/components/Icon";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login Logic
        const res = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (res?.error) {
          setError("Invalid email or password");
        } else {
          router.push("/dashboard");
        }
      } else {
        // Registration Logic
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Registration failed");
        }

        // Auto-login after registration
        await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="card bg-base-100 shadow-2xl w-full max-w-md z-10 border border-base-300/50">
        <div className="p-8">

          <div className="text-center mb-8">
            <div className="mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-xl w-16 h-16 flex items-center justify-center mb-4">
              <Icon name="Zap" className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{isLogin ? "Welcome Back" : "Create Account"}</h1>
            <p className="text-base-content/60 text-sm mt-1">
              {isLogin ? "Enter your credentials to access the dashboard" : "Join the affiliate network today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="form-control">
                <label className="label"><span className="label-text">Full Name</span></label>
                <div className="relative">
                  <Icon name="User" size={16} className="absolute left-3 top-3.5 opacity-50" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="input input-bordered w-full pl-10"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-control">
              <label className="label"><span className="label-text">Email Address</span></label>
              <div className="relative">
                <Icon name="Mail" size={16} className="absolute left-3 top-3.5 opacity-50" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="input input-bordered w-full pl-10"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Password</span></label>
              <div className="relative">
                <Icon name="Lock" size={16} className="absolute left-3 top-3.5 opacity-50" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-10"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error text-xs py-2">
                <Icon name="AlertCircle" size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="divider text-xs opacity-50 my-6">OR</div>

          <div className="text-center text-sm">
            <span className="opacity-70">{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="link link-primary ml-1 font-medium no-underline hover:underline"
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}