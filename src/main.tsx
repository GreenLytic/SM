import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Font } from '@react-pdf/renderer';
import { initDatabase } from './lib/database';

// Register fonts globally to prevent conflicts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlfBBc9.ttf', fontWeight: 700 }
  ]
});

// Initialize app with error boundary
const initializeApp = async () => {
  try {
    console.log('Initializing SQLite database...');
    await initDatabase();
    console.log('Database initialized successfully');

    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error('Failed to find the root element');

    const root = createRoot(rootElement);

    root.render(
      <StrictMode>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1f2937',
              border: '1px solid #e5e7eb'
            },
          }}
        />
      </StrictMode>
    );

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Show fallback UI for critical errors
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
          <h1 style="color: #2F5E1E; margin-bottom: 1rem;">SMARTCOOP</h1>
          <p style="color: #4b5563; margin-bottom: 2rem;">Une erreur est survenue lors du chargement de l'application.</p>
          <button 
            style="background-color: #2F5E1E; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.375rem; cursor: pointer;"
            onclick="window.location.reload()"
          >
            Réessayer
          </button>
        </div>
      `;
    }
  }
};

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}