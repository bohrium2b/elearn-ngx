import Markdown from "../perseus/Markdown";
import React from "react";

export const BasicMarkdown: React.FC<{ content: string, fontFamily: "serif" | "sans-serif" }> = ({ content, fontFamily = 'sans-serif' }) => {
  return <Markdown fontFamily={fontFamily}>{content}</Markdown>;
};

export const BasicMarkdownMemo = React.memo(BasicMarkdown);
export const tagName = "basic-markdown";
export default BasicMarkdownMemo;
