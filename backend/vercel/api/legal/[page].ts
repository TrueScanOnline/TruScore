import type { VercelRequest, VercelResponse } from '@vercel/node';
import { privacyPageHtml, termsPageHtml } from '../../lib/rveelLegalPages';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.page;
  const page = Array.isArray(raw) ? raw[0] : raw;

  if (page !== 'terms' && page !== 'privacy') {
    return res.status(404).setHeader('Content-Type', 'text/plain; charset=utf-8').send('Not found');
  }

  const html = page === 'terms' ? termsPageHtml() : privacyPageHtml();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(html);
}
