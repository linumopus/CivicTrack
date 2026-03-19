import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'maplibre-gl/dist/maplibre-gl.css'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './state/auth/AuthContext'

// #region agent log
function __dbg(message: string, data: Record<string, unknown>) {
  fetch('http://127.0.0.1:7373/ingest/3911a2f7-3173-4132-9c62-388adb0fbaa5', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3d9346' },
    body: JSON.stringify({
      sessionId: '3d9346',
      runId: 'pre-fix',
      hypothesisId: 'H-css',
      location: 'frontend/src/main.tsx:__dbg',
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

window.addEventListener('error', (e) => {
  __dbg('window.error', { message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno });
});
window.addEventListener('unhandledrejection', (e) => {
  __dbg('window.unhandledrejection', { reason: String((e as PromiseRejectionEvent).reason) });
});
// #endregion agent log

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

// #region agent log
requestAnimationFrame(() => {
  try {
    const root = document.getElementById('root');
    const bodyStyle = getComputedStyle(document.body);
    const rootStyle = root ? getComputedStyle(root) : null;

    const probe = document.createElement('div');
    probe.className = 'bg-red-500 text-white p-2';
    probe.textContent = 'probe';
    document.body.appendChild(probe);
    const probeStyle = getComputedStyle(probe);
    probe.remove();

    __dbg('css_probe', {
      bodyMargin: bodyStyle.margin,
      bodyBg: bodyStyle.backgroundColor,
      rootHeight: rootStyle?.height ?? null,
      rootBg: rootStyle?.backgroundColor ?? null,
      probeBg: probeStyle.backgroundColor,
      probeColor: probeStyle.color,
      probePadding: probeStyle.padding,
    });

    const mapContainers = Array.from(document.querySelectorAll('div')).filter((d) =>
      (d as HTMLDivElement).className?.toString?.().includes?.('h-[calc(100vh-3.5rem)]')
    );
    __dbg('dom_probe', { divCount: document.querySelectorAll('div').length, mapContainers: mapContainers.length });
  } catch (e) {
    __dbg('probe_failed', { err: e instanceof Error ? e.message : String(e) });
  }
});
// #endregion agent log
