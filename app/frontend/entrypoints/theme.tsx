import { createTheme } from "@mui/material/styles";
import type { ThemeOptions } from "@mui/material/styles";

// Light theme palette
const lightPalette = {
  mode: "light" as const,
  primary: {
    main: "#2563eb",      // Professional blue
    light: "#60a5fa",
    dark: "#1d4ed8",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#64748b",      // Slate gray
    light: "#94a3b8",
    dark: "#475569",
  },
  success: {
    main: "#10b981",      // Emerald
    light: "#34d399",
    dark: "#059669",
  },
  warning: {
    main: "#f59e0b",      // Amber
    light: "#fbbf24",
    dark: "#d97706",
  },
  error: {
    main: "#ef4444",      // Red
    light: "#f87171",
    dark: "#dc2626",
  },
  background: {
    default: "#f8fafc",   // Light slate background
    paper: "#ffffff",
  },
  text: {
    primary: "#0f172a",   // Slate 900
    secondary: "#475569", // Slate 600
  },
  divider: "#e2e8f0",     // Slate 200
};

// Dark theme palette
const darkPalette = {
  mode: "dark" as const,
  primary: {
    main: "#3b82f6",      // Lighter blue for dark mode
    light: "#60a5fa",
    dark: "#2563eb",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#94a3b8",      // Lighter slate for dark mode
    light: "#cbd5e1",
    dark: "#64748b",
  },
  success: {
    main: "#34d399",      // Lighter emerald
    light: "#6ee7b7",
    dark: "#10b981",
  },
  warning: {
    main: "#fbbf24",      // Lighter amber
    light: "#fde68a",
    dark: "#f59e0b",
  },
  error: {
    main: "#f87171",      // Lighter red
    light: "#fca5a5",
    dark: "#ef4444",
  },
  background: {
    default: "#0f172a",   // Dark slate background
    paper: "#1e293b",    // Slightly lighter for cards
  },
  text: {
    primary: "#f1f5f9",   // Light text
    secondary: "#cbd5e1", // Lighter secondary text
  },
  divider: "#334155",     // Darker divider
};

// Common theme options shared between light and dark
const commonThemeOptions: Omit<ThemeOptions, "palette"> = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: "1.75rem",
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.3,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.125rem",
      lineHeight: 1.4,
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: "1rem",
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: "0.875rem",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.4,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  ] as const,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 16px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          },
        },
        sizeSmall: {
          padding: "4px 12px",
          fontSize: "0.8125rem",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        elevation1: {
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
        sizeSmall: {
          height: 24,
          fontSize: "0.75rem",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: "0.75rem",
        },
      },
    },
  },
};

// Create theme options for a specific mode
function createWorkspaceThemeOptions(mode: "light" | "dark"): ThemeOptions {
  return {
    ...commonThemeOptions,
    palette: mode === "light" ? lightPalette : darkPalette,
  };
}

// Create themes for both modes
export const workspaceLightTheme = createTheme(createWorkspaceThemeOptions("light"));
export const workspaceDarkTheme = createTheme(createWorkspaceThemeOptions("dark"));

// Default export for backward compatibility (light theme)
export const workspaceTheme = workspaceLightTheme;
export default workspaceTheme;

// Helper to get theme by mode
export function getThemeByMode(mode: "light" | "dark") {
  return mode === "light" ? workspaceLightTheme : workspaceDarkTheme;
}
