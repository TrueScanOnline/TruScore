import { armShareImageGate, releaseShareImageGate, waitForShareImageGate } from '../../../components/shareImageCaptureGate';

describe('share image capture gate', () => {
  test('a missing URL is ready immediately', async () => {
    const gate = armShareImageGate('', 1);
    expect(gate.settled).toBe(true);
    await expect(waitForShareImageGate(gate, 20)).resolves.toBe('ready');
  });

  test('an old callback cannot release a newer product gate', async () => {
    const first = armShareImageGate('https://images.example/a.jpg', 1);
    const second = armShareImageGate('https://images.example/b.jpg', 2);
    expect(releaseShareImageGate(second, first.token, first.url)).toBe(false);
    expect(second.settled).toBe(false);
    expect(releaseShareImageGate(second, second.token, second.url)).toBe(true);
    expect(second.settled).toBe(true);
    expect(first.settled).toBe(false);
  });

  test('a slow image reports timeout without marking the gate ready', async () => {
    const gate = armShareImageGate('https://images.example/slow.jpg', 4);
    await expect(waitForShareImageGate(gate, 15)).resolves.toBe('timeout');
    expect(gate.settled).toBe(false);
    expect(releaseShareImageGate(gate, gate.token, gate.url)).toBe(true);
  });
});
