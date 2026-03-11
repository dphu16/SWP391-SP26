import React from "react";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, onClear }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="px-6 py-3 bg-primary/5 border-b border-primary/20 flex items-center gap-4 animate-slide-up">
      <span className="text-sm font-semibold text-primary">
        {selectedCount} selected
      </span>
      <button
        onClick={onClear}
        className="ml-auto text-xs text-text-secondary-light hover:text-text-primary-light transition-colors cursor-pointer"
      >
        Clear
      </button>
    </div>
  );
};

export default BulkActionBar;
