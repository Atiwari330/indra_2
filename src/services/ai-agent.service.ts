import type { AIAgentService } from '@/lib/types/ai-agent';
import { createMockAIService } from '@/lib/mock/ai-service';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AI !== 'false';

export function getAIAgentService(): AIAgentService {
  if (USE_MOCK) {
    return createMockAIService();
  }
  // Future: return createRealAIService()
  return createMockAIService();
}
