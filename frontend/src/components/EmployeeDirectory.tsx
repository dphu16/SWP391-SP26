import React, { useState, useEffect } from 'react';
import FilterBar from './FilterBar';
import EmployeeTable from './EmployeeTable';

const EmployeeDirectory: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filter, setFilter] = useState({ category: "department", value: "All Departments" });

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const handleFilterChange = (category: string, value: string) => {
        setFilter({ category, value });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary-light font-heading">
                    Employee Directory
                </h1>
                <p className="text-text-secondary-light text-sm">
                    Manage and view all employee profiles within your organization.
                </p>
            </div>

            <FilterBar
                onSearch={setSearchTerm}
                onFilterChange={handleFilterChange}
            />

            <EmployeeTable
                searchQuery={debouncedSearch}
                filterCategory={filter.category}
                filterValue={filter.value}
            />
        </div>
    );
};

export default EmployeeDirectory;
