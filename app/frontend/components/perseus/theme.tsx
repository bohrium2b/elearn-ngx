import { createTheme } from "@mui/material/styles";
import type { ThemeOptions } from "@mui/material/styles";

// Light theme palette
const lightPalette = {
  mode: "light" as const,
  primary: {
    main: "#186E23",
  },
  secondary: {
    main: "#6499A0",
  },
  error: {
    main: "#FF5449",
  },
  background: {
    default: "#f8fafc",
    paper: "#ffffff",
  },
  text: {
    primary: "#0f172a",
    secondary: "#475569",
  },
};

// Dark theme palette
const darkPalette = {
  mode: "dark" as const,
  primary: {
    main: "#4ade80",
  },
  secondary: {
    main: "#67e8f9",
  },
  error: {
    main: "#fca5a5",
  },
  background: {
    default: "#0f172a",
    paper: "#1e293b",
  },
  text: {
    primary: "#f1f5f9",
    secondary: "#cbd5e1",
  },
};

// Common theme options shared between light and dark
const commonThemeOptions: Omit<ThemeOptions, "palette"> = {
  components: {
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
          margin: 8,
        },
        switchBase: {
          padding: 1,
          "&.Mui-checked": {
            transform: "translateX(16px)",
            color: "#fff",
            "& + .MuiSwitch-track": {
              opacity: 1,
              border: "none",
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
        },
        track: {
          borderRadius: 13,
          border: "1px solid #bdbdbd",
          backgroundColor: "#fafafa",
          opacity: 1,
          transition:
            "background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
        },
      },
    },
  },
  shape: {
    borderRadius: 10,
  },
};

// Create theme options for a specific mode
function createPerseusThemeOptions(mode: "light" | "dark"): ThemeOptions {
  return {
    ...commonThemeOptions,
    palette: mode === "light" ? lightPalette : darkPalette,
  };
}

// Create themes for both modes
export const perseusLightTheme = createTheme(createPerseusThemeOptions("light"));
export const perseusDarkTheme = createTheme(createPerseusThemeOptions("dark"));

// Default export for backward compatibility (light theme)
export const theme = perseusLightTheme;

export default theme;
