const ARTIFICIAL_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ARTIFICIAL_DELAY_MS));
}

// Pass A has no real file-service to upload to - stores the picked image's own
// local URI as the "path" and hands it straight back as a displayable source,
// so the avatar section is fully tappable/demoable without a backend.
export const mockFileService = {
  async upload(fileUri: string): Promise<{ filePath: string }> {
    return delay({ filePath: fileUri });
  },

  async getAuthenticatedImageSource(filePath: string): Promise<{ uri: string; headers: Record<string, string> } | null> {
    return delay({ uri: filePath, headers: {} });
  },

  async remove(): Promise<void> {
    return delay(undefined);
  },
};
