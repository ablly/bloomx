import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n/config';
import App from './App.tsx';
import ExperienceLayer from './components/ExperienceLayer';
import { AuthProvider } from './contexts/AuthContext';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
    <ExperienceLayer />
    <App />
        </AuthProvider>
    </StrictMode>,
);
