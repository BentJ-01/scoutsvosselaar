/**
 * Entry point of the admin page (public/admin/index.html). Bundled by
 * src/cms/integration.ts into public/admin/, with the configuration from
 * src/cms/config.ts baked in.
 */
import CMS, { type CmsConfig } from '@sveltia/cms';

declare const __CMS_CONFIG__: CmsConfig;

const SAVED_MESSAGE = 'Opgeslagen. Het duurt enkele minuten voor de wijziging online staat.';

/** A small notice after each save, so editors know the site is not updated instantly. */
function showSavedNotice(): void {
  document.getElementById('saved-notice')?.remove();
  const notice = document.createElement('div');
  notice.id = 'saved-notice';
  notice.setAttribute('role', 'status');
  notice.textContent = SAVED_MESSAGE;
  Object.assign(notice.style, {
    position: 'fixed',
    left: '50%',
    top: '16px',
    transform: 'translateX(-50%)',
    zIndex: '100000',
    maxWidth: 'calc(100vw - 32px)',
    padding: '12px 16px',
    borderRadius: '8px',
    background: '#1f1a17',
    color: '#fff',
    font: '15px/1.4 system-ui, sans-serif',
    boxShadow: '0 4px 16px rgb(0 0 0 / 0.25)',
  });
  document.body.append(notice);
  setTimeout(() => notice.remove(), 8000);
}

const config = structuredClone(__CMS_CONFIG__);

// Automated smoke tests use the in-memory backend, only on localhost.
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
if (isLocal && new URLSearchParams(location.search).has('test-repo')) {
  config.backend = { name: 'test-repo' };
}

CMS.registerEventListener({ name: 'postSave', handler: () => showSavedNotice() });
void CMS.init({ config });
