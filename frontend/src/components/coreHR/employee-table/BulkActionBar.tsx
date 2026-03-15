import React from "react";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onDeactivate?: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, onClear, onDeactivate }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="px-6 py-3 bg-primary/5 border-b border-primary/20 flex items-center gap-4 animate-slide-up">
      <span className="text-sm font-semibold text-primary">
        {selectedCount} selected
      </span>
      <div className="ml-auto flex items-center gap-3">
        {onDeactivate && (
          <button
            onClick={onDeactivate}
            className="text-xs px-3 py-1.5 bg-red-50 text-error rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-500"
          >
            Inactive
          </button>
        )}
        <button
          onClick={onClear}
          className="text-xs text-text-secondary-light hover:text-text-primary-light transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default BulkActionBar;
