/**
 * ToastProvider.tsx - Provider component for toast notifications
 *
 * Wraps the application and provides a Snackbar for displaying toast messages.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { setToastHandler } from './useToast';

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleClose = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({
      open: true,
      message,
      severity: type,
    });
  }, []);

  useEffect(() => {
    setToastHandler(showToast);
  }, [showToast]);

  return (
    <>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ToastProvider;
