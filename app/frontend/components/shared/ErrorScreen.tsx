import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Alert,
  Collapse,
} from "@mui/material";
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import React, { useState } from "react";

interface ErrorScreenProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = "Something went wrong",
  message,
  details,
  onRetry,
  onDismiss,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            textAlign: "center",
          }}
        >
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "error.light",
                color: "error.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ErrorIcon sx={{ fontSize: 32 }} />
            </Box>

            <Stack spacing={1}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {message}
              </Typography>
            </Stack>

            {details && (
              <Box sx={{ width: "100%", textAlign: "left" }}>
                <Button
                  size="small"
                  onClick={() => setShowDetails(!showDetails)}
                  endIcon={showDetails ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                  sx={{ mb: 1 }}
                >
                  {showDetails ? "Hide details" : "Show details"}
                </Button>
                <Collapse in={showDetails}>
                  <Alert severity="error" sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                    {details}
                  </Alert>
                </Collapse>
              </Box>
            )}

            <Stack direction="row" spacing={2}>
              {onRetry && (
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={onRetry}
                >
                  Retry
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ErrorScreen;
