import React from "react";
import Box from "@mui/material/Box";
import { type MultiChoiceProps } from "./MultiChoice";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MDEditor from "@uiw/react-md-editor";
import CorrectIcon from "./assets/CorrectIcon.svg?react";
import IncorrectIcon from "./assets/IncorrectIcon.svg?react";
import { TextField, Tooltip, Typography } from "@mui/material";
import { QuestionRendererWithUI as QuestionRenderer } from "./QuestionRenderer";
import theme from "./theme";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export type MultiChoiceEditorProps = {
  question?: string;
  choices?: MultiChoiceProps["choices"];
  hints?: string[];
  questionId?: string;
  numChoices?: number;
};

export type MultiChoiceEditorRef = {
  getQuestion: () => string;
  getChoices: () => MultiChoiceProps["choices"];
  getHints: () => string[];
  getQuestionId: () => string | undefined;
  getNumChoices: () => number;
};

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const MultiChoiceEditor = React.forwardRef<
  MultiChoiceEditorRef,
  MultiChoiceEditorProps
>((props, ref) => {
  // This component allows for the editing/creation of a multiple-choice question.

  const [question, setQuestion] = React.useState<string>(props.question || "");
  const [choices, setChoices] = React.useState<MultiChoiceProps["choices"]>(
    props.choices || [],
  );
  const [hints, setHints] = React.useState<string[]>(props.hints || []);
  const [questionId, setQuestionId] = React.useState<string | undefined>(
    props.questionId || undefined,
  );
  const [numChoices, setNumChoices] = React.useState<number | undefined>(
    props.numChoices || 1,
  );
  const [isPreview, setIsPreview] = React.useState<boolean>(false);

  React.useImperativeHandle(ref, () => ({
    getQuestion: () => question,
    getChoices: () => choices,
    getHints: () => hints,
    getQuestionId: () => questionId,
    getNumChoices: () => numChoices ?? 1,
  }));

  return (
    <Box sx={{ marginBottom: 2, padding: 1 }}>
      {!isPreview ? (
        <>
          <Box sx={{ padding: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", padding: 2 }}>
              <Typography
                component="label"
                variant="h6"
                htmlFor="question-id"
                sx={{ marginRight: 1 }}
              >
                Question
              </Typography>
              <TextField
                id="question-id"
                label="Question Number"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value ?? undefined)}
                variant="outlined"
                size="small"
                sx={{ alignSelf: "center" }}
              />
              <Box sx={{ padding: 2 }}>
                <Button onClick={() => setIsPreview(true)} variant="contained">
                  Preview
                </Button>
              </Box>
            </Box>
            <MarkdownEditor
              value={question}
              onChange={(value) => setQuestion(value ?? "")}
              placeholder={"Enter the question here..."}
              ariaLabel="Question content"
            />
          </Box>
          <MultiChoiceChoicesEditor
            choices={choices}
            onChange={setChoices}
            numChoices={numChoices ?? 1}
            onNumChoicesChange={setNumChoices}
          />
          <MultiChoiceHintsEditor hints={hints} onChange={setHints} />
        </>
      ) : (
        <>
          <QuestionRenderer
            question={{
              type: "multi-choice",
              question,
              choices,
              hints,
              questionId: questionId ?? "",
              numChoices: numChoices ?? 1,
            }}
          />

          <Box sx={{ padding: 2 }}>
            <Button variant="outlined" onClick={() => setIsPreview(false)}>
              Edit
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
});

const MultiChoiceEditorMemo = React.memo(MultiChoiceEditor);

MultiChoiceEditorMemo.displayName = "MultiChoiceEditor";

type MultiChoiceChoicesEditorProps = {
  choices: MultiChoiceProps["choices"];
  numChoices: number;
  onChange: (choices: MultiChoiceProps["choices"]) => void;
  onNumChoicesChange: (numChoices: number) => void;
};

const MultiChoiceChoicesEditor: React.FC<MultiChoiceChoicesEditorProps> = (
  props,
) => {
  // This component is used to edit the choices of a multiple-choice question.

  // Destructure props for easier access
  const { choices, onChange, numChoices, onNumChoicesChange } = props;
  const [isMultiChoice, setIsMultiChoice] = React.useState(numChoices != 1);

  console.log(choices);

  return (
    <Box
      sx={{
        padding: 2,
        margin: 1,
        borderRadius: 3,
        border: "1px solid #d9d9d9",
      }}
    >
      {/* Choices Editor */}
      <Typography variant="h6">Choices</Typography>
      <Typography
        variant="subtitle1"
        sx={{ marginBottom: 2, fontWeight: "bold" }}
      >
        {/* Description of choices -  */}
        Candidates choose{" "}
        {isMultiChoice
          ? choices.filter((choice) => choice.correct).length
          : `a single (there is/are ${choices.filter((choice) => choice.correct).length} correct choice[s])`}{" "}
        choice(s) out of {choices.length} choices.
      </Typography>
      {/* Map through choices and render each choice with an editor */}
      {choices.map((choice, index) => (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 1,
          }}
          key={index}
        >
          <IconButton
            onClick={() => {
              const newChoices = [...choices];
              const currentChoice = newChoices[index];
              if (currentChoice) {
                newChoices[index] = {
                  content: currentChoice.content,
                  correct: !currentChoice.correct,
                  id: currentChoice.id,
                  rationale: currentChoice.rationale,
                };
              }
              onChange(newChoices);
            }}
            sx={{ marginRight: 1 }}
            title={choice.correct ? "Mark as incorrect" : "Mark as correct"}
          >
            {/* Icon for correct/incorrect choice */}
            {choice.correct ? (
              <CorrectIcon style={{ width: 24, height: 24 }} />
            ) : (
              <IncorrectIcon style={{ width: 24, height: 24 }} />
            )}
          </IconButton>
          <Box key={index} sx={{ marginBottom: 1, width: "100%" }}>
            {/* Markdown editor for choice content */}
            <MarkdownEditor
              value={choice.content}
              onChange={(value) => {
                const newChoices = [...choices];
                const currentChoice = newChoices[index];
                if (currentChoice) {
                  newChoices[index] = {
                    content: value ?? "",
                    correct: currentChoice.correct,
                    id: currentChoice.id,
                    rationale: currentChoice.rationale,
                  };
                }
                onChange(newChoices);
              }}
              placeholder={`Enter choice ${letters[index]} here...`}
              ariaLabel={`Choice ${letters[index]} editor`}
            />
            <TextField
              label="Rationale (optional)"
              value={choice.rationale || ""}
              onChange={(e) => {
                const newChoices = [...choices];
                const currentChoice = newChoices[index];
                if (currentChoice) {
                  newChoices[index] = {
                    content: currentChoice.content,
                    correct: currentChoice.correct,
                    id: currentChoice.id,
                    rationale: e.target.value,
                  };
                }
                onChange(newChoices);
              }}
              variant="outlined"
              size="small"
              fullWidth
              sx={{ marginTop: 1 }}
              placeholder="Enter rationale for this choice (shown in review mode)"
            />
          </Box>
          <IconButton
            onClick={() => {
              const newChoices = choices.filter((_, i) => i !== index);
              onChange(newChoices);
            }}
            sx={{ marginLeft: 1 }}
            title="Remove choice"
          >
            <span style={{ fontSize: "24px", lineHeight: "24px" }}>×</span>
          </IconButton>
        </Box>
      ))}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          spacing: 2,
        }}
      >
        <Button
          variant="outlined"
          onClick={() => {
            const newChoice = {
              content: "",
              correct: false,
            } as MultiChoiceProps["choices"][number];
            onChange([...choices, newChoice]);
          }}
          sx={{ marginRight: 2 }}
        >
          Add Choice
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            if (isMultiChoice) {
              setIsMultiChoice(false);
              onNumChoicesChange(1);
            } else {
              setIsMultiChoice(true);
              onNumChoicesChange(choices.length);
            }
          }}
          sx={{ marginRight: 2 }}
        >
          Set {isMultiChoice ? "Single" : "Multi"}-Choice
        </Button>
      </Box>
    </Box>
  );
};

type MultiChoiceHintsEditorProps = {
  hints: string[];
  onChange: (hints: string[]) => void;
};

const MultiChoiceHintsEditor = ({
  hints,
  onChange,
}: MultiChoiceHintsEditorProps) => {
  return (
    <Box
      sx={{
        margin: 1,
        padding: 2,
        border: "1px solid #d9d9d9",
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        Hints
        <Box component="span">
          <Tooltip
            role="alert"
            title="Hints are optional clues or explanations shown to the candidate. They should be used only when the question assesses content beyond the scope of the syllabus and should avoid giving direct answers beyond general guidance to align to syllabus content. "
          >
            <span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#1976d2" />
                <text
                  x="12"
                  y="17"
                  textAnchor="middle"
                  fontSize="16"
                  fill="#fff"
                  fontFamily="Arial"
                  fontWeight="bold"
                  style={{ pointerEvents: "none" }}
                >
                  ?
                </text>
              </svg>
            </span>
          </Tooltip>
        </Box>
      </Typography>
      {hints.map((hint: string, index: number) => (
        <Box key={index} sx={{ display: "flex", alignItems: "top", gap: 1 }}>
          <Typography
            sx={{
              display: "inline",
              fontWeight: "bold",
              color: theme.palette.primary.light,
              fontSizeAdjust: -1,
              paddingRight: 1,
              minWidth: "3em",
              alignContent: "center",
              justifyContent: "center",
            }}
          >
            {index + 1} / {hints.length}
          </Typography>
          <Box key={index} sx={{ marginBottom: 1, width: "95%" }}>
            <MarkdownEditor
              value={hint}
              onChange={(value) => {
                const newHints = [...hints];
                newHints[index] = value ?? "";
                onChange(newHints);
              }}
              placeholder={`Enter hint ${index + 1} here...`}
              ariaLabel={`Hint ${index + 1} editor`}
            />
          </Box>
          <IconButton
            onClick={() => {
              const newHints = hints.filter((_, i) => i !== index);
              onChange(newHints);
            }}
            sx={{ marginLeft: 1 }}
            title="Remove choice"
          >
            <span style={{ fontSize: "24px", lineHeight: "24px" }}>×</span>
          </IconButton>
        </Box>
      ))}
      <Button onClick={() => onChange([...hints, ""])} variant="outlined">
        Add Hint
      </Button>
    </Box>
  );
};

const MarkdownEditor = (props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) => {
  return (
    <Box data-color-mode="light">
      <MDEditor
        value={props.value}
        onChange={(value) => props.onChange(value ?? "")}
        height={100}
        textareaProps={{
          placeholder: props.placeholder || "Enter text here...",
          "aria-label": props.ariaLabel || props.placeholder || "Markdown editor",
        }}
        previewOptions={{
          // enable parsing of $...$ and $$...$$
          remarkPlugins: [remarkMath, remarkGfm],
          // render math with KaTeX
          rehypePlugins: [rehypeKatex],
        }}
      />
    </Box>
  );
};
export default MultiChoiceEditorMemo;
