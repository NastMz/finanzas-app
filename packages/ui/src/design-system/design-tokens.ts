/**
 * Cross-platform design tokens for Web/Desktop/Mobile UI layers.
 */
export const designTokens = {
  colors: {
    brand: {
      300: "#8fb0ff",
      400: "#2f6bff",
      500: "#174ae6",
      600: "#0f2fa8",
    },
    background: {
      canvas: "#eef3fb",
      elevated: "#ffffff",
      surface: "#f8fbff",
      muted: "#dde6f3",
    },
    border: {
      subtle: "rgba(15, 23, 42, 0.08)",
      strong: "rgba(15, 23, 42, 0.16)",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      muted: "#64748b",
    },
    status: {
      success: "#14946b",
      warning: "#d97706",
      danger: "#dc5c54",
      income: "#14946b",
      expense: "#dc5c54",
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
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "1.75rem",
    pill: "9999px",
  },
  typography: {
    fontFamily:
      "\"Plus Jakarta Sans\", \"Avenir Next\", \"Segoe UI\", sans-serif",
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.5rem",
      "2xl": "1.875rem",
    },
    fontWeight: {
      regular: 500,
      medium: 500,
      semibold: 600,
      bold: 800,
    },
    letterSpacing: {
      tight: "-0.03em",
      normal: "0",
      wide: "0.1em",
    },
  },
  shadow: {
    card: "0 28px 60px rgba(15, 23, 42, 0.08), 0 6px 18px rgba(15, 23, 42, 0.06)",
    soft: "0 18px 40px rgba(15, 23, 42, 0.08)",
  },
} as const;

export type DesignTokens = typeof designTokens;
