/**
 * Cross-platform design tokens for Web/Desktop/Mobile UI layers.
 */
export const designTokens = {
  colors: {
    brand: {
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
    },
    background: {
      canvas: "#070b16",
      elevated: "#0a1222",
      surface: "#0f172a",
      muted: "#1e293b",
    },
    border: {
      subtle: "rgba(148, 163, 184, 0.14)",
      strong: "rgba(148, 163, 184, 0.24)",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#cbd5e1",
      muted: "#94a3b8",
    },
    status: {
      success: "#86efac",
      warning: "#fde68a",
      danger: "#fecaca",
      income: "#86efac",
      expense: "#fda4af",
    },
  },
  spacing: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
  },
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.125rem",
    pill: "9999px",
  },
  typography: {
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", sans-serif",
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.5rem",
      "2xl": "1.875rem",
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0",
      wide: "0.12em",
    },
  },
  shadow: {
    card: "0 18px 44px rgba(2, 6, 23, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
    soft: "0 8px 24px rgba(2, 6, 23, 0.24)",
  },
} as const;

export type DesignTokens = typeof designTokens;
