import React from "react";
import { useNavigate } from "react-router-dom";
import { Pagination, ErrorState, EmptyState } from "./shared";
import SkeletonRow from "./shared/SkeletonRow";
import TableHeader from "./employee-table/TableHeader";
import TableRow from "./employee-table/TableRow";
import BulkActionBar from "./employee-table/BulkActionBar";
import { useEmployeeTable } from "./hooks/useEmployeeTable";

interface EmployeeTableProps {
  searchQuery?: string;
  filterCategory?: string;
  filterValue?: string;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  searchQuery,
  filterCategory,
  filterValue,
}) => {
  const navigate = useNavigate();
  const {
    employees,
    loading,
    error,
    page,
    setPage,
    pageInfo,
    selectedIds,
    setSelectedIds,
    sortField,
    sortDir,
    fetchEmployees,
    allSelected,
    toggleAll,
    toggleOne,
    handleDeactivateSingle,
    handleSort,
  } = useEmployeeTable(searchQuery, filterCategory, filterValue);

  if (error && !loading) {
    return (
      <ErrorState
        message={error}
        onRetry={() => fetchEmployees(page, searchQuery)}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-border-light bg-surface-light overflow-hidden shadow-card animate-fade-in">
      <BulkActionBar 
        selectedCount={selectedIds.size} 
        onClear={() => setSelectedIds(new Set())} 
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <TableHeader
            allSelected={allSelected}
            onToggleAll={toggleAll}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <tbody className="divide-y divide-gray-50 text-sm">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : employees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    emp={emp}
                    isSelected={selectedIds.has(emp.id)}
                    onToggle={toggleOne}
                    onView={(id) => navigate(`/employee/${id}`)}
                    onDeactivate={handleDeactivateSingle}
                  />
                ))}
          </tbody>
        </table>
      </div>

      {!loading && employees.length === 0 && (
        <EmptyState
          title="No employees found"
          description="Try adjusting your filters or add a new employee."
        />
      )}

      {!loading && pageInfo.totalElements > 0 && (
        <Pagination
          currentPage={page}
          totalPages={pageInfo.totalPages}
          totalElements={pageInfo.totalElements}
          pageSize={pageInfo.size}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default EmployeeTable;
