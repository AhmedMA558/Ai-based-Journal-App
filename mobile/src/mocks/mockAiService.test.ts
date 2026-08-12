import { mockAiService } from './mockAiService';

describe('mockAiService.chat', () => {
  it('returns a keyword-matched response for a recognizable message', async () => {
    const reply = await mockAiService.chat('I am so stressed about my workload today');
    expect(reply).toMatch(/control/i);
  });

  it('returns a non-empty default response for an unrecognized message', async () => {
    const reply = await mockAiService.chat('what is the weather pattern in the pacific northwest');
    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(0);
  });

  it('rotates through default responses on repeated unrecognized messages', async () => {
    const first = await mockAiService.chat('completely unrelated query one');
    const second = await mockAiService.chat('completely unrelated query two');
    expect(first).not.toBe(second);
  });
});

describe('mockAiService.detectMood', () => {
  it('returns null for empty content', async () => {
    const result = await mockAiService.detectMood('   ');
    expect(result).toBeNull();
  });

  it('detects ANGRY from keywords', async () => {
    const result = await mockAiService.detectMood('I am so angry and furious right now');
    expect(result?.primaryMood).toBe('ANGRY');
  });
});
