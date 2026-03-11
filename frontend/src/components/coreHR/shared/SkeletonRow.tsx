import React from "react";

const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 7 }) => (
  <tr className="border-b border-gray-100">
    {cols >= 1 && (
      <td className="pl-6 pr-4 py-4 w-10">
        <div className="skeleton w-4 h-4 rounded" />
      </td>
    )}
    <td className="px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="skeleton h-2.5 w-20 rounded" />
        </div>
      </div>
    </td>
    {Array.from({ length: cols - 2 }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div
          className={`skeleton h-3.5 rounded ${i === cols - 3 ? "w-20 h-6 rounded-full" : "w-24"}`}
        />
      </td>
    ))}
  </tr>
);

export default SkeletonRow;
