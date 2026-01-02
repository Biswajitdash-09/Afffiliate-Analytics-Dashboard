"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const SimpleChart = ({ 
  data = [], 
  xKey = "name", 
  yKey = "value", 
  color = "primary", 
  height = 250,
  formatValue = (v) => v
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 100;
    const max = Math.max(...data.map(d => Number(d[yKey]) || 0));
    return max === 0 ? 100 : max * 1.1; // Add 10% buffer
  }, [data, yKey]);

  // Color mapping
  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    accent: "bg-accent",
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
  };

  const barColor = colorClasses[color] || "bg-primary";

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-base-200/30 rounded-xl border border-dashed border-base-300" style={{ height }}>
        <p className="text-base-content/40 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full relative select-none" style={{ height }}>
      {/* Y-Axis Grid Lines (Optional visual aid) */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full border-t border-base-content"></div>
        ))}
      </div>

      <div className="h-full flex items-end justify-between gap-2 pt-6 pb-6 px-2">
        {data.map((item, index) => {
          const value = Number(item[yKey]) || 0;
          const percentage = (value / maxValue) * 100;
          const isHovered = hoveredIndex === index;

          return (
            <div 
              key={index} 
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-10 z-20 bg-base-300 text-base-content text-xs font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap pointer-events-none"
                >
                  {formatValue(value)}
                </motion.div>
              )}

              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
                className={`w-full max-w-[40px] min-w-[8px] rounded-t-md ${barColor} opacity-80 hover:opacity-100 transition-opacity relative`}
              >
                {/* Highlight effect on hover */}
                {isHovered && (
                  <div className="absolute inset-0 bg-white/20 rounded-t-md"></div>
                )}
              </motion.div>

              {/* X-Axis Label */}
              <div className="mt-2 text-[10px] sm:text-xs text-base-content/60 truncate w-full text-center font-medium">
                {item[xKey]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleChart;