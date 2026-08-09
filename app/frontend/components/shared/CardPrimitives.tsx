export const LIST_CARD_SX = {
  elevation: 0,
  borderRadius: 3,
  border: "1px solid rgba(24,33,47,0.08)",
  transition: "box-shadow 0.2s",
  "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
} as const;

export const LIST_CARD_CONTENT_SX = {
  py: 1.5,
  px: 2,
  "&:last-child": { pb: 1.5 },
} as const;

export const ROW_LAYOUT_SX = {
  display: "flex",
  flexDirection: { xs: "column", sm: "row" } as const,
  gap: 2,
  alignItems: { xs: "flex-start", sm: "center" } as const,
  justifyContent: "space-between" as const,
} as const;

export const LEFT_COLUMN_SX = {
  flex: 1,
  minWidth: 180,
} as const;

export const STAT_PAPER_SX = {
  p: 2,
  borderRadius: 3,
  textAlign: "center",
  border: "1px solid rgba(24,33,47,0.08)",
} as const;

export const ALERT_RADIUS = 3;
