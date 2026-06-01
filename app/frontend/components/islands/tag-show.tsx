import { Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";

type TagPayload = {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  color: string;
  permalink: string;
};

type TagShowProps = {
  tag: TagPayload;
  createPath: string;
  updatePath: string;
  deletePath: string;
  workspacePath: string;
  csrfToken: string;
};

export const TagShowIsland: React.FC<TagShowProps> = ({
  tag,
  createPath,
  updatePath,
  deletePath,
  workspacePath,
  csrfToken,
}) => {
  const [editName, setEditName] = useState(tag.name);
  const [editColor, setEditColor] = useState(tag.color);
  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setEditName(tag.name);
    setEditColor(tag.color);
  }, [tag]);

  const saveTag = async (path: string, payload: { name: string; color: string; parent_id?: number }, redirectToCurrent = false) => {
    const response = await fetch(path, {
      method: path === createPath ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ tag: payload }),
    });

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(json?.message || "Unable to save tag.");
      return;
    }

    if (json?.tag?.permalink) {
      window.location.href = json.tag.permalink;
      return;
    }

    if (redirectToCurrent) {
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${tag.name}?`)) {
      return;
    }

    const response = await fetch(deletePath, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": csrfToken,
        Accept: "application/json",
      },
    });

    if (response.ok) {
      window.location.href = workspacePath;
    }
  };

  const panelStyle = {
    p: 2,
    borderRadius: 4,
    border: "1px solid rgba(24, 33, 47, 0.12)",
    bgcolor: "rgba(255,255,255,0.92)",
    boxShadow: "0 18px 48px rgba(24, 33, 47, 0.06)",
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
        background:
          "radial-gradient(circle at top left, rgba(108, 122, 137, 0.12), transparent 34%), linear-gradient(180deg, #faf7f2 0%, #eef1f5 100%)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 960,
          mx: "auto",
          borderRadius: 5,
          border: "1px solid rgba(24, 33, 47, 0.12)",
          boxShadow: "0 24px 64px rgba(24, 33, 47, 0.08)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            py: { xs: 2, md: 3 },
            borderBottom: "1px solid rgba(24, 33, 47, 0.08)",
            background: "rgba(255,255,255,0.88)",
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  bgcolor: tag.color,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
                }}
              />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                {tag.name}
              </Typography>
              <Chip label={tag.slug} variant="outlined" />
            </Stack>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Canonical permalink: {tag.permalink}
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2.5, md: 4 } }}>
          <Stack spacing={2.5}>
            {message ? <Typography color="error">{message}</Typography> : null}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <Box sx={panelStyle}>
                <Stack spacing={1.5}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Edit Tag</Typography>
                  <TextField label="Tag name" value={editName} onChange={(event) => setEditName(event.target.value)} fullWidth />
                  <TextField label="Color" value={editColor} onChange={(event) => setEditColor(event.target.value)} fullWidth helperText="Use a hex color like #3a7bd5" />
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="contained"
                      onClick={() => saveTag(updatePath, { name: editName, color: editColor }, true)}
                    >
                      Save changes
                    </Button>
                  </Stack>
                </Stack>
              </Box>

              <Box sx={panelStyle}>
                <Stack spacing={1.5}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Create Child Tag</Typography>
                  <TextField label="Child tag name" value={createName} onChange={(event) => setCreateName(event.target.value)} fullWidth />
                  <TextField label="Color" value={createColor} onChange={(event) => setCreateColor(event.target.value)} fullWidth helperText="Leave blank to auto-generate" />
                  <Button
                    variant="contained"
                    onClick={() => saveTag(createPath, { name: createName, color: createColor, parent_id: tag.id })}
                  >
                    Create child tag
                  </Button>
                </Stack>
              </Box>
            </Box>

            <Box>
              <Typography variant="overline" sx={{ letterSpacing: 1.6, color: "text.secondary" }}>
                Tag Metadata
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: "wrap" }}>
                <Chip label={`UUID ${tag.uuid}`} />
                <Chip label={`Color ${tag.color}`} />
              </Stack>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button variant="contained" onClick={() => (window.location.href = workspacePath)}>
                Back to workspace
              </Button>
              <Button color="error" variant="outlined" onClick={handleDelete}>
                Delete tag
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export const tagName = "tag-show";
export default TagShowIsland;