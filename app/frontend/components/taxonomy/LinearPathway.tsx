/**
 * LinearPathway.tsx – Gamified linear pathway flow view
 *
 * Displays a course's learning pathway as a vertical "snake" path with
 * animated topic nodes. Shows gamification elements (streak, gems, hearts)
 * and progress tracking. Topics alternate left/right for visual interest.
 *
 * Props: { courseId: string }
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Skeleton,
  Alert,
  Button,
} from "@mui/material";
import {
  CheckCircle,
  Lock,
  PlayCircleOutlined,
  LocalFireDepartment,
  EmojiEvents,
  Favorite,
  MenuBook,
  ArrowBack,
  Star,
} from "@mui/icons-material";
import { Course, Topic, UserProgress } from "./types";
import { learningPathwaysApi } from "./api";

interface GamificationStatus {
  streak: number;
  hearts: number;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface LinearPathwayProps {
  courseId: string;
}

interface TopicNodeProps {
  topic: Topic;
  status: "completed" | "active" | "locked";
  index: number;
  unitName: string;
  onStart: () => void;
}

// ── TopicNode Component ───────────────────────────────────────────────────────

const TopicNode: React.FC<TopicNodeProps> = ({
  topic,
  status,
  index,
  unitName,
  onStart,
}) => {
  const isEven = index % 2 === 0;

  const getNodeStyle = () => {
    switch (status) {
      case "completed":
        return {
          bgcolor: "success.main",
          color: "white",
          borderColor: "success.dark",
          boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
        };
      case "active":
        return {
          bgcolor: "primary.main",
          color: "white",
          borderColor: "primary.dark",
          boxShadow: "0 4px 20px rgba(25, 118, 210, 0.5)",
        };
      case "locked":
        return {
          bgcolor: "grey.300",
          color: "grey.600",
          borderColor: "grey.400",
        };
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle fontSize="large" />;
      case "active":
        return <PlayCircleOutlined fontSize="large" />;
      case "locked":
        return <Lock fontSize="large" />;
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: isEven ? "flex-start" : "flex-end",
        width: "100%",
        mb: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: isEven ? "row" : "row-reverse",
          gap: 2,
          maxWidth: { xs: "90%", sm: "70%", md: "60%" },
        }}
      >
        {/* Node Circle */}
        <Zoom in timeout={500 + index * 100}>
          <Paper
            sx={{
              width: { xs: 64, sm: 80 },
              height: { xs: 64, sm: 80 },
              borderRadius: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: status === "active" ? "pointer" : "default",
              transition: "all 0.3s ease",
              ...getNodeStyle(),
              "&:hover":
                status === "active"
                  ? {
                    transform: "scale(1.1)",
                    boxShadow: "0 8px 30px rgba(25, 118, 210, 0.6)",
                  }
                  : status === "completed"
                    ? { transform: "scale(1.05)" }
                    : {},
              ...(status === "active"
                ? {
                  animation: "topicPulse 2s infinite",
                  "@keyframes topicPulse": {
                    "0%": { boxShadow: "0 0 0 0 rgba(25, 118, 210, 0.5)" },
                    "70%": {
                      boxShadow: "0 0 0 15px rgba(25, 118, 210, 0)",
                    },
                    "100%": { boxShadow: "0 0 0 0 rgba(25, 118, 210, 0)" },
                  },
                }
                : {}),
            }}
            onClick={status === "active" ? onStart : undefined}
            elevation={status === "active" ? 8 : 2}
          >
            {getStatusIcon()}
          </Paper>
        </Zoom>

        {/* Topic Info */}
        <Fade in timeout={700 + index * 100}>
          <Box sx={{ textAlign: isEven ? "left" : "right", flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", opacity: 0.7 }}
            >
              {unitName}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", fontSize: { xs: "0.9rem", sm: "1rem" } }}
            >
              {topic.name}
            </Typography>
            {topic.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: { xs: "none", sm: "-webkit-box" },
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {topic.description}
              </Typography>
            )}
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                mt: 0.5,
                justifyContent: isEven ? "flex-start" : "flex-end",
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={`${topic.questions_count || 0} Q`}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: "0.7rem" }}
              />
              {topic.tags?.slice(0, 2).map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{
                    backgroundColor: tag.color || "primary.main",
                    color: "white",
                    height: 22,
                    fontSize: "0.7rem",
                  }}
                />
              ))}
            </Box>

            {status === "active" && (
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayCircleOutlined />}
                onClick={onStart}
                sx={{
                  mt: 1,
                  textTransform: "none",
                  fontWeight: "bold",
                  animation: "bounce 1.5s infinite",
                  "@keyframes bounce": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-4px)" },
                  },
                }}
              >
                Start
              </Button>
            )}

            {status === "completed" && (
              <Chip
                icon={<Star sx={{ fontSize: 14 }} />}
                label="Done"
                size="small"
                color="success"
                variant="outlined"
                sx={{ mt: 0.5, height: 24 }}
              />
            )}
          </Box>
        </Fade>
      </Box>

      {/* Connector Line */}
      {status !== "locked" && (
        <Box
          sx={{
            width: 4,
            height: 30,
            bgcolor: status === "completed" ? "success.main" : "primary.main",
            borderRadius: 2,
            ml: isEven ? { xs: 4, sm: 5 } : undefined,
            mr: isEven ? undefined : { xs: 4, sm: 5 },
            alignSelf: isEven ? "flex-start" : "flex-end",
            opacity: 0.6,
          }}
        />
      )}

      {/* Locked connector (dashed) */}
      {status === "locked" && (
        <Box
          sx={{
            width: 2,
            height: 30,
            bgcolor: "grey.300",
            borderRadius: 1,
            ml: isEven ? { xs: 4, sm: 5 } : undefined,
            mr: isEven ? undefined : { xs: 4, sm: 5 },
            alignSelf: isEven ? "flex-start" : "flex-end",
            opacity: 0.4,
          }}
        />
      )}
    </Box>
  );
};

// ── Gamification Header ───────────────────────────────────────────────────────

const GamificationHeader: React.FC<{
  progress: UserProgress | null;
  streak: number;
  hearts: number;
}> = ({ progress: _progress, streak, hearts }) => (
  <Paper
    sx={{
      p: 2,
      mb: 3,
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      borderRadius: 3,
    }}
  >
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <LocalFireDepartment sx={{ color: "#ff9800" }} />
            <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              {streak}
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              day streak
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <EmojiEvents sx={{ color: "#ffd700" }} />
            <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              0
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              gems
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Favorite sx={{ color: "#e91e63" }} />
            <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              {hearts}
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              hearts
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Switch to Library View">
          <IconButton color="inherit" href="/learning_pathways">
            <MenuBook />
          </IconButton>
        </Tooltip>
      </Box>
    </Container>
  </Paper>
);

// ── Main LinearPathway Component ──────────────────────────────────────────────

export const LinearPathway: React.FC<LinearPathwayProps> = ({ courseId }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [gamification, setGamification] = useState<GamificationStatus>({ streak: 0, hearts: 5 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [courseData, progressData, gamificationData] = await Promise.all([
        learningPathwaysApi.getCourse(courseId),
        learningPathwaysApi.getProgress(courseId),
        fetch("/api/gamification/status", {
          headers: { Accept: "application/json" },
        })
          .then((res) => (res.ok ? res.json() : { streak: 0, hearts: 5 }))
          .catch(() => ({ streak: 0, hearts: 5 })),
      ]);
      setCourse(courseData);
      setProgress(progressData);
      setGamification({
        streak: gamificationData?.streak || 0,
        hearts: gamificationData?.hearts || 5,
      });
    } catch (err) {
      console.error("Failed to load course:", err);
      setError("Failed to load course. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleStartTopic = async (topic: Topic) => {
    try {
      await learningPathwaysApi.startTopic(courseId, topic.path_identifier);
      window.location.href = `/taxonomy/${topic.path_identifier}/play`;
    } catch (err) {
      console.error("Failed to start topic:", err);
    }
  };

  const getTopicStatus = (
    topic: Topic,
    completedIds: number[],
    activeTopicId: number | null
  ): "completed" | "active" | "locked" => {
    if (completedIds.includes(topic.id)) return "completed";
    if (topic.id === activeTopicId) return "active";
    return "locked";
  };

  const activeTopicId = useMemo(() => {
    if (!progress || !course) return null;
    const completedIds = new Set(progress.completed_topic_ids || []);
    for (const part of course.parts ?? []) {
      for (const unit of part.units ?? []) {
        for (const topic of unit.topics ?? []) {
          if (!completedIds.has(topic.id)) return topic.id;
        }
      }
    }
    return null;
  }, [progress, course]);

  // ── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ bgcolor: "grey.50", minHeight: "100vh" }}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Skeleton variant="rectangular" height={80} sx={{ mb: 3, borderRadius: 3 }} />
          <Skeleton variant="rectangular" height={120} sx={{ mb: 3, borderRadius: 3 }} />
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={100}
              sx={{ mb: 2, borderRadius: 2 }}
            />
          ))}
        </Container>
      </Box>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadCourse}>
          Retry
        </Button>
      </Container>
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────────

  if (!course) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">Course not found</Alert>
      </Container>
    );
  }

  // ── Build topic list with unit names ───────────────────────────────────────

  const allTopics: { topic: Topic; unitName: string; partName: string }[] = [];
  course.parts?.forEach((part) => {
    part.units?.forEach((unit) => {
      unit.topics?.forEach((topic) => {
        allTopics.push({
          topic,
          unitName: unit.name,
          partName: part.name,
        });
      });
    });
  });

  // Group topics by unit for display
  const unitsWithTopics: {
    unit: { id: number; name: string; description?: string | null };
    topics: { topic: Topic; globalIndex: number }[];
    partName: string;
  }[] = [];

  course.parts?.forEach((part) => {
    part.units?.forEach((unit) => {
      if (unit.topics && unit.topics.length > 0) {
        const topicsWithIndex = unit.topics.map((topic) => ({
          topic,
          globalIndex: allTopics.findIndex(
            (t) => t.topic.id === topic.id
          ),
        }));
        unitsWithTopics.push({
          unit: {
            id: unit.id,
            name: unit.name,
            description: unit.description,
          },
          topics: topicsWithIndex,
          partName: part.name,
        });
      }
    });
  });

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", pb: 8 }}>
      {/* Gamification Header */}
      <GamificationHeader
        progress={progress}
        streak={gamification.streak}
        hearts={gamification.hearts}
      />

      <Container maxWidth="md">
        {/* Course Header */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            textAlign: "center",
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <Button
            startIcon={<ArrowBack />}
            href="/learning_pathways"
            size="small"
            sx={{ mb: 1 }}
          >
            All Courses
          </Button>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
          >
            {course.name}
          </Typography>
          {course.description && (
            <Typography variant="body1" color="text.secondary">
              {course.description}
            </Typography>
          )}
        </Paper>

        {/* Units and Topics */}
        {unitsWithTopics.map((unitData) => (
          <Box key={unitData.unit.id} sx={{ mb: 3 }}>
            {/* Unit Header */}
            <Paper
              sx={{
                p: 2,
                mb: 2,
                bgcolor: "info.light",
                borderLeft: 4,
                borderColor: "info.main",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                {unitData.unit.name}
              </Typography>
              {unitData.unit.description && (
                <Typography variant="body2" color="text.secondary">
                  {unitData.unit.description}
                </Typography>
              )}
            </Paper>

            {/* Topics Snake Path */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                py: 2,
              }}
            >
              {unitData.topics.map((item, topicIndex) => (
                <TopicNode
                  key={item.topic.id}
                  topic={item.topic}
                  status={getTopicStatus(item.topic, progress?.completed_topic_ids || [], activeTopicId)}
                  index={topicIndex}
                  unitName={unitData.unit.name}
                  onStart={() => handleStartTopic(item.topic)}
                />
              ))}
            </Box>
          </Box>
        ))}

        {/* Empty state if no topics */}
        {allTopics.length === 0 && (
          <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
            <Typography color="text.secondary">
              No topics available in this course yet.
            </Typography>
          </Paper>
        )}

        {/* Progress Summary */}
        {progress && allTopics.length > 0 && (
          <Paper
            sx={{
              p: 3,
              mt: 3,
              textAlign: "center",
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Your Progress
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {progress.completed_topics} of {progress.total_topics} topics
              completed
            </Typography>
            <Box
              sx={{
                width: "100%",
                height: 12,
                bgcolor: "grey.200",
                borderRadius: 6,
                overflow: "hidden",
                mb: 1,
              }}
            >
              <Box
                sx={{
                  width: `${progress.percentage}%`,
                  height: "100%",
                  bgcolor:
                    progress.percentage === 100 ? "success.main" : "primary.main",
                  transition: "width 0.5s ease",
                  borderRadius: 6,
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {progress.percentage}% complete
            </Typography>
            {progress.percentage === 100 && (
              <Chip
                icon={<EmojiEvents />}
                label="Course Complete!"
                color="success"
                sx={{ mt: 1 }}
              />
            )}
          </Paper>
        )}
      </Container>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 1,
          display: "flex",
          justifyContent: "center",
          gap: { xs: 2, sm: 4 },
          borderRadius: 0,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
          zIndex: 10,
        }}
      >
        <IconButton color="primary" href="/learning_pathways">
          <MenuBook />
        </IconButton>
        <IconButton href={`/learning_pathways/${courseId}`}>
          <PlayCircleOutlined />
        </IconButton>
        <IconButton>
          <EmojiEvents />
        </IconButton>
        <IconButton>
          <Favorite />
        </IconButton>
      </Paper>
    </Box>
  );
};

export default LinearPathway;
