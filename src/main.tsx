import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Toaster } from './components/ui/sonner.tsx';
import { ThemeProvider } from './components/theme-provider.tsx';
import { AuthProvider } from './Config/AuthContext.tsx';
import { Provider } from 'react-redux';
import { createAppStore } from './redux/store/store.ts';

const store = createAppStore();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="invoice-theme">
        <Provider store={store}>
          <App />
          <Toaster />
        </Provider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);
