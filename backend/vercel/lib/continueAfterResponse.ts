import { waitUntil } from '@vercel/functions';

/**
 * Keep serverless work alive after the HTTP response.
 * waitUntil is the Vercel request continuation; a bare floating promise can be frozen
 * when the response ends.
 */
export function continueAfterResponse(work: Promise<unknown>): void {
  waitUntil(work);
}
