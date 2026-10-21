import { join } from 'node:path';
import { readVoskeManifest } from '@/integrations/voske-pages';
import { url } from '@/lib/paths';

/** The flip-book reader when the pages were rendered, otherwise the PDF itself. */
export const voskeReadHref = (v: { id: string; data: { pdf?: string | undefined } }) =>
  readVoskeManifest(join(process.cwd(), 'public'), v.data.pdf!) ? url(`/voske/${v.id}/`) : url(v.data.pdf!);
