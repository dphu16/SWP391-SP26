import React from "react";

const DetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="rounded-2xl border border-border-light bg-surface-light shadow-card p-6 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="skeleton w-20 h-20 rounded-full" />
              <div className="skeleton h-5 w-36 rounded" />
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            <div className="border-t border-border-light pt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-4 h-4 rounded" />
                  <div className="skeleton h-3.5 w-40 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
          <div className="skeleton h-10 w-full rounded-xl" />
          <div className="rounded-2xl border border-border-light bg-surface-light shadow-card p-6 space-y-4">
            <div className="skeleton h-5 w-32 rounded" />
            <div className="grid grid-cols-2 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-4 w-36 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailSkeleton;
