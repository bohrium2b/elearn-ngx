import {
  ServerItemRenderer,
  type PerseusDependencies,
  type VideoKind,
} from "@khanacademy/perseus";
import { PerseusI18nContextProvider } from "@khanacademy/perseus";
import { type PerseusItem } from "@khanacademy/perseus-core";
import { scorePerseusItem } from "@khanacademy/perseus-score";
import {
  useState,
  useRef,
  useImperativeHandle,
  useCallback,
  forwardRef,
} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Dependencies } from "@khanacademy/perseus";
import Button from "@mui/material/Button";
import { mockStrings } from "@khanacademy/perseus/strings";
import { useTheme } from "@mui/material/styles";
import Markdown from "../perseus/Markdown";

import { TeX } from "../perseus/TeX";
import "@khanacademy/perseus/styles.css";
import "./PerseusRenderer.css"; // Assuming you have a CSS file for styles

export type PerseusRendererProps = {
  question: string;
  item: PerseusItem;
  hints?: string[];
  questionId?: string;
  onScoreChange?: (score: number) => void;
  reviewMode?: boolean;
  newRadioWidget?: boolean;
  showHintsUI?: boolean;
  numberOfHintsToShow?: number;
};

export type PerseusRendererRef = {
  getScore: () => number | null;
  getHintsIndex: () => number;
};

export const dependencies: PerseusDependencies = {
  // JIPT
  JIPT: {
    useJIPT: false,
  },
  graphieMovablesJiptLabels: {
    addLabel: (_label, _useMath) => {},
  },
  svgImageJiptLabels: {
    addLabel: (_label, _useMath) => {},
  },
  rendererTranslationComponents: {
    addComponent: (_renderer) => -1,
    removeComponentAtIndex: (_index) => {},
  },

  TeX: TeX,

  // @ts-expect-error - TS2322 - Type '(str?: string | null | undefined) => string' is not assignable to type 'StaticUrlFn'.
  staticUrl: (str?: string | null) => {
    // We define the interface such that TypeScript can infer calls properly.
    // However, it means that return types are hard to match here in
    // the implementation.
    return `mockStaticUrl(${str})`;
  },

  // video widget
  // @ts-expect-error - TS7002 - Parameter 'id' implicitly has an 'any' type.
  useVideo: (_id, _kind) => {
    // Used by video-transcript-link.jsx.fixture.js
    if (_id === "YoutubeId" && _kind === "YOUTUBE_ID") {
      return {
        status: "success",
        data: {
          video: {
            id: "YoutubeVideo",
            contentId: "contentId",
            youtubeId: "YoutubeId",
            title: "Youtube Video Title",
            __typename: "Video",
          },
        },
      };
    }
    if (_id === "slug-video-id" && _kind === "READABLE_ID") {
      return {
        status: "success",
        data: {
          video: {
            title: "Slug Video Title",
            id: "VideoId",
            youtubeId: "YoutubeId",
            contentId: "contentId",
            __typename: "Video",
          },
        },
      };
    }

    return {
      status: "loading",
    };
  },

  InitialRequestUrl: {
    origin: "origin-test-interface",
    host: "host-test-interface",
    protocol: "protocol-test-interface",
  },

  isDevServer: false,
  kaLocale: "en",
  Log: { log: () => {}, error: () => {} },
};

export const PerseusRenderer = forwardRef<
  PerseusRendererRef,
  PerseusRendererProps
>((props, ref) => {
  /*
    This component is a Perseus renderer that uses the ServerItemRenderer from the Perseus framework.
    It allows for rendering Perseus items with support for scoring, hints, and localization.
    It uses the PerseusI18nContextProvider for localization and registers core widgets.
    It also sets up dependencies for the Perseus framework.
    */
  // This component renders a Perseus item using the ServerItemRenderer from Perseus.
  // It allows for scoring and hint management, and uses the PerseusI18nContextProvider for localization.
  // It also registers core widgets and sets dependencies for the Perseus framework.
  const { question, item, hints, questionId } = props;
  const rendererRef = useRef<typeof ServerItemRenderer | null>(null);
  // const [hintsIndex, setHintsIndex] = useState(-1);
  const [_] = useState(0);
  const [, setScore] = useState<number | null>(null);
  const theme = useTheme();
  const [hintsControlled] = useState(
    props.numberOfHintsToShow !== null &&
      props.numberOfHintsToShow !== undefined &&
      props.showHintsUI === false,
  );

  if (
    hintsControlled &&
    props.numberOfHintsToShow !== null &&
    props.numberOfHintsToShow !== undefined &&
    props.showHintsUI === false
  ) {
    var hintsIndex = props.numberOfHintsToShow - 1;
  } else {
    var [hintsIndex, setHintsIndex] = useState(-1);
  }

  const getScore = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) {
      return null;
    }
    // @ts-expect-error - TS2339 - Property 'getUserInput' does not exist on type 'PerseusRenderer'.
    const userInput = renderer.getUserInput();
    console.log(userInput);
    if (!userInput) {
      return null;
    }
    const rawScore = scorePerseusItem(item.question, userInput, "en");
    if (!rawScore) {
      return null;
    }
    if (rawScore.type !== "points") {
      return -1;
    }
    setScore(rawScore.earned / rawScore.total);
    return rawScore.earned / rawScore.total;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getScore: () => getScore(),
      getHintsIndex: () => hintsIndex,
    }),
    [getScore, hintsIndex],
  );
  /*const getScore = () => {
        const renderer = rendererRef.current;
        if (!renderer) {
            return null;
        }
        const userInput = renderer.getUserInput();
        if (!userInput) {
            return null;
        }
        const scoreRaw = scorePerseusItem(renderer as unknown as PerseusRenderer, userInput, "en");
        if (!scoreRaw) {
            return null;
        }
        // @ts-expect-error scoreRaw is not typed correctly
        setScore(scoreRaw.earned / scoreRaw.total);
    }

    useEffect(() => {
        getScore();
        if (props.onScoreChange) {
            props.onScoreChange(score ?? 0);
        }
    }, [score, props, props.onScoreChange]);*/
  // registerCoreWidgets();
  Dependencies.setDependencies(dependencies);
  return (
    <Box sx={{ width: "98%", borderRadius: 3, overflow: "none" }}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "top",
          gap: 1,
          padding: 1,
          fontFamily: "Noto Serif, serif",
          overflow: "auto",
        }}
      >
        {questionId && (
          <Typography
            sx={{
              display: "inline-flex",
              justifyContent: "center",
              fontWeight: "bold",
              color:
                questionId.length === 1
                  ? theme.palette.common.white
                  : theme.palette.primary.light,
              border:
                questionId.length === 1
                  ? `1px solid ${theme.palette.primary.light}`
                  : "none",
              backgroundColor:
                questionId.length === 1
                  ? theme.palette.primary.light
                  : "inherit",
              borderRadius: questionId.length === 1 ? "24px" : "0",
              padding: questionId.length === 1 ? "0.25rem" : "0.25rem",
              width: questionId.length === 1 ? "1.5rem" : "auto",
              height: 0,
              paddingBottom: questionId.length === 1 ? "1.75rem" : "0",
            }}
          >
            {questionId?.toUpperCase()}
          </Typography>
        )}
        <Box sx={{ display: "inline", maxWidth: "50rem;" }}>
          <Markdown>{question}</Markdown>
        </Box>
      </Box>
      <Box
        sx={{ padding: 2, fontFamily: "Roboto, sans-serif", overflow: "auto" }}
        className="perseus-framework"
      >
        <PerseusI18nContextProvider locale="en" strings={mockStrings}>
          <ServerItemRenderer
            // @ts-expect-error - TS2322 - Type 'MutableRefObject<PerseusRenderer | null>' is not assignable to type 'Ref<PerseusRenderer>'.
            ref={rendererRef}
            item={item}
            dependencies={{
              analytics: {
                onAnalyticsEvent: () => Promise.resolve(),
              },
              useVideo: (_id: string, _kind: VideoKind) => ({
                status: "success",
                data: { video: null },
              }),
              generateUrl: (_args: any) => {
                return "mockGenerateUrl";
              },
            }}
            reviewMode={props.reviewMode ?? false}
            apiOptions={{
              flags: {
                "new-radio-widget": props.newRadioWidget ?? false,
                "image-widget-upgrade": true,
              },
            }}
            hintsVisible={0}
            disabled={props.reviewMode || false}
          />
        </PerseusI18nContextProvider>
      </Box>
      {hints && hints.length > 0 && (
        <Box
          sx={{
            padding: 2,
            overflow: "auto",
            fontFamily: "Roboto, sans-serif",
            borderTop: "1px solid #d9d9d9",
            "@media print": {
              display: "none",
            },
          }}
        >
          {hintsIndex >= 0 && hintsIndex <= hints.length ? (
            <>
              {hints.slice(0, hintsIndex + 1).map((hint, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{ marginTop: "10px" }}
                >
                  <Box
                    sx={{ display: "inline-flex", alignItems: "top", gap: 1 }}
                  >
                    <Typography
                      sx={{
                        display: "inline",
                        fontWeight: "bold",
                        color: theme.palette.primary.light,
                        fontSizeAdjust: -1,
                        paddingRight: 1,
                      }}
                    >
                      {index + 1} / {hints.length}
                    </Typography>
                    <Box sx={{ display: "inline", maxWidth: "60rem" }}>
                      <Markdown>{hint}</Markdown>
                    </Box>
                  </Box>
                </Typography>
              ))}
            </>
          ) : (
            <Typography variant="body1"></Typography>
          )}
          {props.showHintsUI !== false && (
            <Box>
              {hintsIndex != hints.length - 1 ? (
                <Button
                  onClick={() => setHintsIndex((prev) => prev + 1)}
                  style={{ marginTop: "10px" }}
                  variant="contained"
                >
                  {hintsIndex == -1 ? "Stuck? Get a hint" : "Next Hint"}
                </Button>
              ) : (
                <Button
                  disabled
                  style={{ marginTop: "10px" }}
                  variant="contained"
                >
                  No More Hints
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
});

export default PerseusRenderer;
