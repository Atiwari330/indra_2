import type { AIAgentService } from '@/lib/types/ai-agent';
import { createMockAIService } from '@/lib/mock/ai-service';
import { createRealAIService } from './ai-agent.real';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AI !== 'false';

export function getAIAgentService(): AIAgentService {
  if (USE_MOCK) {
    return createMockAIService();
  }
  return createRealAIService();
}
