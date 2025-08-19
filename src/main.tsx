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

// Also handle unhandled promise rejections for ResizeObserver
const resizeObserverRejectHandler = (e: PromiseRejectionEvent) => {
  if (e.reason && e.reason.toString().includes('ResizeObserver')) {
    e.preventDefault()
    return false
  }
  return true
}

// Suppress ResizeObserver errors at the global level
const originalConsoleError = console.error
console.error = (...args) => {
  const message = args[0]?.toString() || ''
  if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
    return // Silently ignore ResizeObserver loop errors
  }
  originalConsoleError.apply(console, args)
}

window.addEventListener('error', resizeObserverErrorHandler)
window.addEventListener('unhandledrejection', resizeObserverRejectHandler)

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
