function freshService() {
  return require('./mockUserService').mockUserService;
}

beforeEach(() => {
  jest.resetModules();
});

describe('mockUserService', () => {
  it('getProfile returns seeded defaults', async () => {
    const service = freshService();
    const profile = await service.getProfile();
    expect(profile.country).toBe('United States');
    expect(typeof profile.bio).toBe('string');
  });

  it('updateProfile replaces the stored profile and getProfile reflects it', async () => {
    const service = freshService();
    const updated = await service.updateProfile({ bio: 'New bio', country: 'Canada', city: 'Toronto' });
    expect(updated).toEqual({ bio: 'New bio', country: 'Canada', city: 'Toronto' });

    const fetched = await service.getProfile();
    expect(fetched).toEqual({ bio: 'New bio', country: 'Canada', city: 'Toronto' });
  });
});
