import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './App';
import { queryClient } from './lib/queryClient';
import { ToastViewport } from './components/ui/Toast';
import './index.css';
// Resolved at build time by vite.config.js: the real demo transport in the
// demo build, an empty no-op module in every other build.
import '@/bootstrap/demo';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastViewport />
    </QueryClientProvider>
  </React.StrictMode>
);
