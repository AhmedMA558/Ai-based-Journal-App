const ARTIFICIAL_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ARTIFICIAL_DELAY_MS));
}

// Pass A has no backend for this either - a single canned suggestion,
// matching the real service's own NEUTRAL-bucket default so Pass A and a
// no-journals Pass B account look the same.
export const mockRecommendationService = {
  async getSuggestion(): Promise<string | null> {
    return delay('Take 5 deep breaths and reflect on 3 good things today.');
  },
};
