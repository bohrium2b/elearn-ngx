import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Divider,
    IconButton,
    Paper,
    Stack,
    TextField,
} from "@mui/material";
import { Delete, Edit, Save, Visibility } from "@mui/icons-material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { QuestionRendererWithUI } from "../perseus/QuestionRenderer";
import MultiChoiceEditorMemo, { type MultiChoiceEditorRef } from "../perseus/MultiChoiceEditor";
import type { QuestionNode } from "./types";
import { toPerseusQuestion } from "./utils";

type QuestionDetailPanelProps = {
    question: QuestionNode;
    csrfToken: string;
    onQuestionDeleted: (questionId: number) => void;
    onQuestionSaved: (updatedQuestion: QuestionNode) => void;
    slugEditable?: boolean;
    slugValue?: string | null;
    onSlugChange?: (next: string) => void;
    onSlugSave?: () => void;
    startEditing?: boolean;
    onStartedEditing?: () => void;
    compactMode?: boolean;
};

export function QuestionDetailPanel({
    question,
    csrfToken,
    onQuestionDeleted,
    onQuestionSaved,
    slugEditable,
    slugValue,
    onSlugChange,
    onSlugSave,
    startEditing,
    onStartedEditing,
    compactMode = false,
}: QuestionDetailPanelProps): React.JSX.Element {
    const [isEditing, setIsEditing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const editorRef = useRef<MultiChoiceEditorRef>(null);
    const [localSlugEditing, setLocalSlugEditing] = useState<boolean>(Boolean(slugEditable));
    const [slugSaving, setSlugSaving] = useState(false);
    const previewQuestion = useMemo(() => toPerseusQuestion(question), [question]);
    const previewKey = useMemo(
        () =>
            `${question.id}-${JSON.stringify({ q: question.question, choices: question.choices, hints: question.hints, numChoices: question.numChoices })}`,
        [question],
    );

    useEffect(() => {
        setIsEditing(false);
        setErrorMessage(null);
    }, [question]);

    useEffect(() => {
        setLocalSlugEditing(Boolean(slugEditable));
    }, [slugEditable]);

    useEffect(() => {
        if (startEditing) {
            setIsEditing(true);
            onStartedEditing?.();
        }
    }, [startEditing, onStartedEditing]);

    const handleSave = async () => {
        const currentQuestion = editorRef.current?.getQuestion() || "";
        const currentChoices = editorRef.current?.getChoices() || [];
        const currentHints = editorRef.current?.getHints() || [];
        const currentNumChoices = editorRef.current?.getNumChoices() || 1;

        if (currentQuestion.trim().length < 10) {
            setErrorMessage("Question must be at least 10 characters long.");
            return;
        }

        if (currentChoices.length < 2) {
            setErrorMessage("Question must include at least two choices.");
            return;
        }

        if (!currentChoices.some((choice) => choice.correct)) {
            setErrorMessage("Question must have at least one correct choice.");
            return;
        }

        const response = await fetch(question.updatePath, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
                "X-Inline-Edit": "true",
            },
            body: JSON.stringify({
                question: currentQuestion,
                choices: currentChoices,
                hints: currentHints,
                numChoices: currentNumChoices,
                slug: question.slug,
            }),
        });

        if (!response.ok) {
            setErrorMessage("Failed to save question changes.");
            return;
        }

        const payload = await response.json().catch(() => null);
        if (payload?.question) {
            onQuestionSaved({
                ...question,
                ...payload.question,
                source_tag_id: question.source_tag_id,
            } as QuestionNode);
            setIsEditing(false);
            return;
        }

        onQuestionSaved(question);
        setIsEditing(false);
    };

    const handleDeleteQuestion = async () => {
        if (!window.confirm(`Delete question ${question.label}?`)) {
            return;
        }

        const response = await fetch(question.updatePath, {
            method: "DELETE",
            headers: {
                "X-CSRF-Token": csrfToken,
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            setErrorMessage("Failed to delete question.");
            return;
        }

        onQuestionDeleted(question.id);
    };

    return (
        <Card
            data-testid="question-detail-panel"
            elevation={0}
            sx={{
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
            }}
        >
            {!compactMode && (
                <CardHeader
                    title="Selected Question"
                    subheader={question.slug}
                    action={
                        <Stack direction="row" spacing={1}>
                            {localSlugEditing ? (
                                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                    <TextField size="small" value={slugValue ?? ""} onChange={(e) => onSlugChange?.(e.target.value)} />
                                    <Button
                                        size="small"
                                        onClick={async () => {
                                            if (!onSlugSave) return;
                                            setSlugSaving(true);
                                            await onSlugSave();
                                            setSlugSaving(false);
                                            setLocalSlugEditing(false);
                                        }}
                                        variant="contained"
                                        disabled={slugSaving}
                                    >
                                        Save slug
                                    </Button>
                                </Stack>
                            ) : (
                                <Chip label={question.slug} variant="outlined" />
                            )}
                            <IconButton
                                data-testid="question-edit-toggle"
                                size="small"
                                onClick={() => setIsEditing((c) => !c)}
                                color={isEditing ? "primary" : "default"}
                            >
                                {isEditing ? <Visibility /> : <Edit />}
                            </IconButton>
                            <IconButton
                                data-testid="question-delete-button"
                                size="small"
                                color="error"
                                onClick={handleDeleteQuestion}
                            >
                                <Delete />
                            </IconButton>
                        </Stack>
                    }
                    slotProps={{
                        title: { variant: "h6" as const, fontWeight: 600 },
                        subheader: { variant: "caption" as const },
                    }}
                />
            )}

            {compactMode && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
                    <IconButton
                        data-testid="question-edit-toggle"
                        size="small"
                        onClick={() => setIsEditing((c) => !c)}
                        color={isEditing ? "primary" : "default"}
                    >
                        {isEditing ? <Visibility /> : <Edit />}
                    </IconButton>
                    <IconButton
                        data-testid="question-delete-button"
                        size="small"
                        color="error"
                        onClick={handleDeleteQuestion}
                    >
                        <Delete />
                    </IconButton>
                </Box>
            )}

            <Divider />

            <CardContent sx={{ p: 3 }}>
                {errorMessage && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                {!isEditing ? (
                    <Box data-testid="question-preview-panel" sx={{ bgcolor: "background.default", p: 2, borderRadius: 1 }}>
                        <QuestionRendererWithUI key={previewKey} question={previewQuestion} />
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        <Paper
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 1 }}
                        >
                            <MultiChoiceEditorMemo
                                key={`${question.id}-${question.slug}`}
                                ref={editorRef}
                                question={question.question || ""}
                                choices={question.choices ?? []}
                                hints={question.hints ?? []}
                                numChoices={question.numChoices ?? 1}
                            />
                        </Paper>
                        <Stack direction="row" spacing={1}>
                            <Button
                                data-testid="question-save-button"
                                variant="contained"
                                startIcon={<Save />}
                                onClick={handleSave}
                            >
                                Save Changes
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}
