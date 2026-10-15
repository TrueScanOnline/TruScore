/** Presentation-only wait for the share card image. It does not choose a score. */

export type ShareImageGate = {
  token: number;
  url: string;
  promise: Promise<void>;
  resolve: () => void;
  settled: boolean;
};

export function armShareImageGate(url: string, token: number): ShareImageGate {
  const gate = {
    token,
    url,
    settled: false,
    promise: undefined as unknown as Promise<void>,
    resolve: () => undefined,
  } as ShareImageGate;
  gate.promise = new Promise<void>((settle) => {
    gate.resolve = () => {
      if (gate.settled) return;
      gate.settled = true;
      settle();
    };
  });
  if (!url) gate.resolve();
  return gate;
}

/** An older card can settle only the gate it was given. */
export function releaseShareImageGate(gate: ShareImageGate | null, token: number, url: string): boolean {
  if (!gate || gate.settled || gate.token !== token || gate.url !== url) return false;
  gate.resolve();
  return true;
}

export function waitForShareImageGate(gate: ShareImageGate, timeoutMs: number): Promise<'ready' | 'timeout'> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    gate.promise.then(() => 'ready' as const),
    new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), timeoutMs);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
