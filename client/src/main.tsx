import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { ToastProvider } from './components/Toast';
import { SelectionProvider } from './lib/selection';
import { watchSystemTheme } from './lib/theme';
import './index.css';

registerSW({ immediate: true });
watchSystemTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
      networkMode: 'always', // let the service worker answer from its cache while offline
    },
    mutations: { networkMode: 'always' },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <SelectionProvider>
            <App />
          </SelectionProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
