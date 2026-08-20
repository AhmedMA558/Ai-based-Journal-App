import { USE_MOCKS } from '@/config/env';
import { authService as realAuthService } from './authService';
import { journalService as realJournalService } from './journalService';
import { aiService as realAiService } from './aiService';
import { searchService as realSearchService } from './searchService';
import { userService as realUserService } from './userService';
import { fileService as realFileService } from './fileService';
import { notificationService as realNotificationService } from './notificationService';
import { recommendationService as realRecommendationService } from './recommendationService';
import { analyticsService as realAnalyticsService } from './analyticsService';
import { mockAuthService } from '@/mocks/mockAuthService';
import { mockJournalService } from '@/mocks/mockJournalService';
import { mockAiService } from '@/mocks/mockAiService';
import { mockSearchService } from '@/mocks/mockSearchService';
import { mockUserService } from '@/mocks/mockUserService';
import { mockFileService } from '@/mocks/mockFileService';
import { mockNotificationService } from '@/mocks/mockNotificationService';
import { mockRecommendationService } from '@/mocks/mockRecommendationService';
import { mockAnalyticsService } from '@/mocks/mockAnalyticsService';

// The one file that changes between Pass A (prototype, mocks) and Pass B (real
// integration) - every screen imports authService/journalService/aiService/
// searchService/userService from here, never from services/authService.ts or
// mocks/mockAuthService.ts (etc.) directly.
export const authService = USE_MOCKS ? mockAuthService : realAuthService;
export const journalService = USE_MOCKS ? mockJournalService : realJournalService;
export const aiService = USE_MOCKS ? mockAiService : realAiService;
export const searchService = USE_MOCKS ? mockSearchService : realSearchService;
export const userService = USE_MOCKS ? mockUserService : realUserService;
export const fileService = USE_MOCKS ? mockFileService : realFileService;
export const notificationService = USE_MOCKS ? mockNotificationService : realNotificationService;
export const recommendationService = USE_MOCKS ? mockRecommendationService : realRecommendationService;
export const analyticsService = USE_MOCKS ? mockAnalyticsService : realAnalyticsService;
