import { useState, useEffect } from "react";

interface UseDebouncedSearchReturn {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  debouncedSearch: string;
  filter: { category: string; value: string };
  handleFilterChange: (category: string, value: string) => void;
}

export function useDebouncedSearch(
  delay = 500,
  defaultCategory = "department",
  defaultValue = "All Departments",
): UseDebouncedSearchReturn {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState({
    category: defaultCategory,
    value: defaultValue,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, delay);
    return () => clearTimeout(handler);
  }, [searchTerm, delay]);

  const handleFilterChange = (category: string, value: string) => {
    setFilter({ category, value });
  };

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    filter,
    handleFilterChange,
  };
}
