import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

const DefaultIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-6 h-6 text-gray-400"
  >
    <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
  </svg>
);

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
}) => (
  <div className="py-20 flex flex-col items-center gap-3 text-center animate-fade-in">
    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
      {icon ?? <DefaultIcon />}
    </div>
    <p className="font-semibold text-text-primary-light">{title}</p>
    <p className="text-sm text-text-secondary-light">{description}</p>
  </div>
);

export default EmptyState;
