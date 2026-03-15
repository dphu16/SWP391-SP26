import type { UserRole } from "../../../hooks/useAuth";

/** A single menu item (leaf node, no children) */
export interface SidebarMenuItem {
  key: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  roles?: UserRole[];
  badge?: number;
  /** Extra path prefixes that should also mark this item as active */
  activeMatchPaths?: string[];
}

/** A collapsible group containing child items */
export interface SidebarMenuGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  children: SidebarMenuItem[];
  /** Extra path prefixes for parent active state (auto-derived from children if omitted) */
  activeMatchPaths?: string[];
}

/** A labeled section (e.g. "Core", "Management") */
export interface SidebarSection {
  key: string;
  sectionLabel: string;
  roles?: UserRole[];
  items: (SidebarMenuItem | SidebarMenuGroup)[];
}

export function isMenuGroup(
  item: SidebarMenuItem | SidebarMenuGroup,
): item is SidebarMenuGroup {
  return (
    "children" in item && Array.isArray((item as SidebarMenuGroup).children)
  );
}
