/**
 * hello-island.tsx – Example React Island
 *
 * Demonstrates the end-to-end pipeline:
 *   Rails view  →  <hello-island data-props='{"greeting":"Hi","name":"World"}'></hello-island>
 *   web_components.ts auto-discovers this file and registers the custom element.
 *   The browser upgrades the element and mounts this React component inside it.
 *
 * Drop your own TSX files alongside this one, export `tagName` and a default
 * React component, and they'll be picked up automatically.
 */

import { Typography, Box, Chip } from "@mui/material";
import WavingHandIcon from "@mui/icons-material/WavingHand";

// ── Island tag name (must contain a hyphen per the Custom Elements spec) ──────
export const tagName = "hello-island";

// ── Props interface ───────────────────────────────────────────────────────────
interface HelloIslandProps {
  greeting?: string;
  name?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HelloIsland({ greeting = "Hello", name = "World" }: HelloIslandProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <WavingHandIcon color="primary" />
      <Typography variant="h6" component="span">
        {greeting}, <strong>{name}</strong>!
      </Typography>
      <Chip label="React Island ✓" color="success" size="small" />
    </Box>
  );
}
