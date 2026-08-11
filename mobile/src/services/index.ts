import { USE_MOCKS } from '@/config/env';
import { authService as realAuthService } from './authService';
import { journalService as realJournalService } from './journalService';
import { aiService as realAiService } from './aiService';
import { mockAuthService } from '@/mocks/mockAuthService';
import { mockJournalService } from '@/mocks/mockJournalService';
import { mockAiService } from '@/mocks/mockAiService';

// The one file that changes between Pass A (prototype, mocks) and Pass B (real
// integration) - every screen imports authService/journalService/aiService from
// here, never from services/authService.ts or mocks/mockAuthService.ts directly.
export const authService = USE_MOCKS ? mockAuthService : realAuthService;
export const journalService = USE_MOCKS ? mockJournalService : realJournalService;
export const aiService = USE_MOCKS ? mockAiService : realAiService;
