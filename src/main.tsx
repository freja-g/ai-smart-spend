import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './hooks/use-auth'

// Suppress ResizeObserver loop errors
const resizeObserverErrorHandler = (e: ErrorEvent) => {
  if (e.message && e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
    e.stopImmediatePropagation()
    return false
  }
  return true
}

window.addEventListener('error', resizeObserverErrorHandler)

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
