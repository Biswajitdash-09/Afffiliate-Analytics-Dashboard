"use client";

import Icon from "@/components/Icon";

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend = "neutral", 
  trendValue, 
  description, 
  color = "primary", 
  loading = false 
}) => {
  
  // Color mapping for backgrounds and text
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-error/10 text-error",
    neutral: "bg-neutral/10 text-neutral",
  };

  const iconColorClass = colorMap[color] || colorMap.primary;

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-200 p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="h-12 w-12 rounded-xl bg-base-300 animate-pulse"></div>
          <div className="h-6 w-16 rounded-full bg-base-300 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-24 bg-base-300 rounded animate-pulse"></div>
          <div className="h-8 w-32 bg-base-300 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-300 group h-full">
      <div className="card-body p-6">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${iconColorClass} transition-transform duration-300 group-hover:scale-110`}>
            <Icon name={icon} size={24} />
          </div>
          
          {trendValue && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
              trend === "up" ? "bg-success/10 text-success" : 
              trend === "down" ? "bg-error/10 text-error" : 
              "bg-base-200 text-base-content/60"
            }`}>
              <Icon 
                name={trend === "up" ? "TrendingUp" : trend === "down" ? "TrendingDown" : "Minus"} 
                size={14} 
              />
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-base-content/60">{title}</p>
          <h3 className="text-3xl font-bold text-base-content mt-1 tracking-tight">{value}</h3>
          {description && (
            <p className="text-xs text-base-content/40 mt-2">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;