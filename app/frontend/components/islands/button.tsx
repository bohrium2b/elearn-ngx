import { Button } from "@mui/material";
import React from "react";

export const MyButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: "text" | "outlined" | "contained";
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
}> = ({ children, onClick, variant, color }) => {
  return (
    <Button variant={variant} color={color} onClick={onClick}>
      {children}
    </Button>
  );
};

export const tagName = "md-button";
export default MyButton;
