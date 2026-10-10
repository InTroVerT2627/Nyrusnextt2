import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export default function Skeleton({
  className = "",
  width,
  height,
  borderRadius = "6px",
}: SkeletonProps) {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="skeleton-card" aria-busy="true" aria-live="polite">
      <div className="skeleton-row" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Skeleton width="40px" height="40px" borderRadius="8px" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          <Skeleton width="40%" height="16px" />
          <Skeleton width="70%" height="12px" />
        </div>
      </div>
      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Skeleton width="100%" height="14px" />
        <Skeleton width="90%" height="14px" />
        <Skeleton width="60%" height="14px" />
      </div>
    </div>
  );
}
