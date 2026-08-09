import { Box, Pagination as MuiPagination, Typography } from "@mui/material";

export interface PaginationControlsProps {
  count: number;
  page: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export function PaginationControls({
  count,
  page,
  onPageChange,
  label,
}: PaginationControlsProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        mt: 2,
      }}
    >
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
      <MuiPagination
        count={count}
        page={page}
        onChange={(_, value) => onPageChange(value)}
        color="primary"
        size="small"
      />
    </Box>
  );
}
