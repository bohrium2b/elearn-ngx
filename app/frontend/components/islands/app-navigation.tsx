/**
 * app-navigation.tsx – Global Navigation Island
 *
 * A role-based navigation bar that renders different navigation items
 * depending on the user's role. Reads user data from HTML attributes
 * passed by the Rails backend.
 *
 * Usage in Rails view:
 *   <app-navigation
 *     username="johndoe"
 *     avatar_url="https://..."
 *     role="instructor"
 *     authenticated="true"
 *   ></app-navigation>
 *
 * Or for unauthenticated users:
 *   <app-navigation authenticated="false"></app-navigation>
 */

import { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useDarkMode } from "../../context/ThemeContext";
import "./app-navigation.css";
import { styled } from "@mui/material/styles";

// ── Island tag name (must contain a hyphen per the Custom Elements spec) ──────
export const tagName = "app-navigation";

// ── Types ──────────────────────────────────────────────────────────────────────
interface UserData {
  username: string;
  avatar_url: string | null;
  role: "student" | "content_author" | "instructor" | "admin";
  authenticated: boolean;
}

interface NavItem {
  label: string;
  href: string;
  testId?: string;
}

// ── Props interface (attributes passed as data-props JSON) ─────────────────────
interface AppNavigationProps {
  username?: string;
  avatar_url?: string;
  role?: string;
  authenticated?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function AppNavigation({
  username: propsUsername,
  avatar_url: propsAvatarUrl,
  role: propsRole,
  authenticated: propsAuthenticated,
}: AppNavigationProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const { isDark, toggle } = useDarkMode();
  const NavContainerNoPrint = styled("nav")({
    "@media print": {
      display: "none",
    },
  });

  useEffect(() => {
    // Try to read from data-props first (passed as JSON), then fall back to HTML attributes
    const element = document.querySelector("app-navigation");

    // Use props from data-props if available, otherwise read from HTML attributes
    const username = propsUsername || element?.getAttribute("username");
    const avatarUrl = propsAvatarUrl || element?.getAttribute("avatar_url");
    const role = (propsRole || element?.getAttribute("role") || "student") as UserData["role"];
    const authenticated = propsAuthenticated ?? (element?.getAttribute("authenticated") === "true");

    if (authenticated && username) {
      setUserData({
        username,
        avatar_url: avatarUrl && avatarUrl !== "null" ? avatarUrl : null,
        role,
        authenticated: true,
      });
    } else {
      setUserData({ authenticated: false } as UserData);
    }
  }, [propsUsername, propsAvatarUrl, propsRole, propsAuthenticated]);

  const getNavItems = (role: string): NavItem[] => {
    const baseItems: NavItem[] = [
      { label: "Dashboard", href: "/", testId: "nav-dashboard" },
      { label: "Courses", href: "/courses", testId: "nav-courses" },
      { label: "Exercises", href: "/exercises", testId: "nav-exercises" },
    ];

    switch (role) {
      case "admin":
        return [
          ...baseItems,
          { label: "Workspace", href: "/workspace", testId: "workspace-link" },
          { label: "Analytics", href: "/analytics", testId: "nav-analytics" },
          { label: "Users", href: "/admin/users", testId: "admin-link" },
        ];
      case "instructor":
        return [
          ...baseItems,
          { label: "Analytics", href: "/analytics", testId: "nav-analytics" },
        ];
      case "content_author":
        return [
          ...baseItems,
          { label: "Workspace", href: "/workspace", testId: "workspace-link" },
        ];
      case "student":
      default:
        return [
          ...baseItems,
          { label: "My Analytics", href: "/analytics/dashboard", testId: "nav-analytics" },
        ];
    }
  };

  const renderAuthenticatedNav = () => {
    if (!userData?.authenticated) return null;

    const navItems = getNavItems(userData.role);

    return (
      <NavContainerNoPrint className="app-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <a href="/" className="nav-logo">E-Learn</a>
          </div>

          <div className="nav-items">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="nav-item"
                data-testid={item.testId}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="nav-actions">
            <IconButton
              onClick={toggle}
              size="small"
              className="theme-toggle"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </div>

          <div className="nav-user">
            <div className="user-menu">
              {userData.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt={userData.username}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {userData.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="user-name">{userData.username}</span>
              <div className="user-dropdown">
                <div className="dropdown-header">Account</div>
                <a href="/users/edit" className="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Profile Settings
                </a>
                <div className="dropdown-divider"></div>
                <a href="/users/sign_out" data-method="delete" className="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Sign Out
                </a>
              </div>
            </div>
          </div>
        </div>
      </NavContainerNoPrint>
    );
  };

  const renderPublicNav = () => {
    return (
      <NavContainerNoPrint className="app-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <a href="/" className="nav-logo">E-Learn</a>
          </div>

          <div className="nav-items">
            <a href="/courses" className="nav-item">Courses</a>
            <a href="/about" className="nav-item">About</a>
          </div>

          <div className="nav-actions">
            <IconButton
              onClick={toggle}
              size="small"
              className="theme-toggle"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </div>

          <div className="nav-auth">
            <a href="/users/sign_in" className="nav-item">Sign In</a>
            <a href="/users/sign_up" className="btn btn-primary">Get Started</a>
          </div>
        </div>
      </NavContainerNoPrint>
    );
  };

  return userData?.authenticated ? renderAuthenticatedNav() : renderPublicNav();
}
