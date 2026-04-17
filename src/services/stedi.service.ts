// Factory for the Stedi service. Mirrors the ai-agent.service.ts pattern.
// Returns a mock implementation today; future work would add a real HTTP
// client and pick based on a NEXT_PUBLIC_USE_MOCK_STEDI env flag.

import { createMockStediService, MockStediService } from '@/lib/mock/stedi.service';

export type StediService = MockStediService;

let instance: StediService | null = null;

export function getStediService(): StediService {
  if (!instance) {
    instance = createMockStediService();
  }
  return instance;
}
