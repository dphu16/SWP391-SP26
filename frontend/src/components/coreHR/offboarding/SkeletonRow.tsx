import React from "react";

const SkeletonRow: React.FC = () => (
  <tr className="border-b border-gray-100">
    <td className="px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="skeleton h-2.5 w-20 rounded" />
        </div>
      </div>
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-3.5 w-24 rounded" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-3.5 w-20 rounded" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-6 w-20 rounded-full" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-3.5 w-24 rounded" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-8 w-20 rounded-lg" />
    </td>
  </tr>
);

export default SkeletonRow;
