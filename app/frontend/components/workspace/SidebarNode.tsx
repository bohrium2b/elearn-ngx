import {
    Badge,
    Box,
    Button,
    Collapse,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import { ChevronRight, ExpandMore } from "@mui/icons-material";
import React, { useState } from "react";
import type { TagNode, QuestionNode, DragPayload } from "./types";
import { getTotalQuestionsCount } from "./utils";

type SidebarNodeProps = {
    node: TagNode;
    expanded: Set<string>;
    onToggle: (uuid: string) => void;
    onSelect: (uuid: string) => void;
    onDeselectQuestion: () => void;
    onQuestionClick: (question: QuestionNode, parentNode: TagNode) => void;
    onQuestionDragStart: (payload: DragPayload) => void;
    onTagDrop: (targetTagId: number, payload: DragPayload) => void;
    depth?: number;
};

export function SidebarNode({
    node,
    expanded,
    onToggle,
    onSelect,
    onDeselectQuestion,
    onQuestionClick,
    onQuestionDragStart,
    onTagDrop,
    depth = 0,
}: SidebarNodeProps): React.JSX.Element {
    const isOpen = expanded.has(node.uuid);
    const [showAllQuestionsInSidebar, setShowAllQuestionsInSidebar] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const indentation = depth * 16; // 16px per depth level - kept for potential future use

    const handleSelectTag = () => {
        // Expand the tag if it's not already expanded
        if (!isOpen) {
            onToggle(node.uuid);
        }
        // Unselect any selected question first
        onDeselectQuestion();
        // Set as current tag
        onSelect(node.uuid);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        onTagDrop(node.id, JSON.parse(raw) as DragPayload);
    };

    return (
        <Box component="li" sx={{ listStyle: "none", mb: 0.5 }}>
            <ListItem
                disablePadding
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                sx={{
                    borderRadius: 1,
                    "&:hover": { bgcolor: "action.hover" },
                }}
            >
                <ListItemButton
                    onClick={() => onToggle(node.uuid)}
                    sx={{ borderRadius: 1, py: 1 }}
                >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                        {isOpen ? (
                            <ExpandMore fontSize="small" />
                        ) : (
                            <ChevronRight fontSize="small" />
                        )}
                    </ListItemIcon>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                bgcolor: node.color,
                                boxShadow: `0 0 0 2px ${node.color}20`,
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primary={node.name}
                        slotProps={{
                            primary: {
                                variant: "subtitle2" as const,
                                sx: { fontWeight: 600 },
                            },
                        }}
                    />
                    <Badge
                        badgeContent={getTotalQuestionsCount(node)}
                        color="primary"
                        sx={{
                            "& .MuiBadge-badge": {
                                fontSize: "0.625rem",
                                height: 18,
                                minWidth: 18,
                            },
                        }}
                    />
                    <Button
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTag();
                        }}
                        sx={{ ml: 1, minWidth: "auto" }}
                    >
                        Select
                    </Button>
                </ListItemButton>
            </ListItem>

            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <List
                    component="div"
                    disablePadding
                    sx={{
                        pl: 2,
                        borderLeft: depth === 0 ? 2 : 0,
                        borderColor: "divider",
                        ml: depth === 0 ? 2 : 0
                    }}
                >
                    {/* Subtags Section with visual hierarchy */}
                    {node.subtags.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                            {node.subtags.map((child) => (
                                <SidebarNode
                                    key={child.id}
                                    node={child}
                                    expanded={expanded}
                                    onToggle={onToggle}
                                    onSelect={onSelect}
                                    onDeselectQuestion={onDeselectQuestion}
                                    onQuestionClick={onQuestionClick}
                                    onQuestionDragStart={onQuestionDragStart}
                                    onTagDrop={onTagDrop}
                                    depth={depth + 1}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Questions Section */}
                    {(() => {
                        const visible = showAllQuestionsInSidebar ? node.questions : node.questions.slice(0, 3);
                        return (
                            <>
                                {visible.map((question) => (
                                    <ListItem
                                        key={question.id}
                                        disablePadding
                                        sx={{ mb: 0.25 }}
                                    >
                                        <ListItemButton
                                            draggable
                                            onDragStart={(event) => {
                                                const payload: DragPayload = { questionId: question.id, sourceTagId: node.id };
                                                event.dataTransfer.setData("application/json", JSON.stringify(payload));
                                                onQuestionDragStart(payload);
                                            }}
                                            onClick={() => onQuestionClick(question, node)}
                                            sx={{
                                                borderRadius: 1,
                                                py: 0.75,
                                                pl: 2,
                                                cursor: "grab",
                                                "&:active": { cursor: "grabbing" },
                                                bgcolor: "action.hover",
                                                "&:hover": { bgcolor: "action.selected" },
                                            }}
                                        >
                                            <ListItemText
                                                primary={question.label}
                                                secondary={question.slug}
                                                slotProps={{
                                                    primary: { variant: "body2" as const },
                                                    secondary: { variant: "caption" as const },
                                                }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}

                                {node.questions.length > 3 ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                                        <Button size="small" onClick={() => setShowAllQuestionsInSidebar((s) => !s)}>
                                            {showAllQuestionsInSidebar ? "Show less" : `... (${node.questions.length - 3} more)`}
                                        </Button>
                                    </Box>
                                ) : null}
                            </>
                        );
                    })()}
                </List>
            </Collapse>
        </Box>
    );
}
