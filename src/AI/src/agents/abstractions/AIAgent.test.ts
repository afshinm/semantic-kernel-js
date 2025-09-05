import { type ChatMessage } from '../../contents';
import { AIAgent } from './AIAgent';

class MyAIAgent extends AIAgent {
  override runCore(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  override runStreamingCore(): AsyncGenerator<ChatMessage> {
    throw new Error('Method not implemented.');
  }
}

describe('AIAgent', () => {
  it('should create agents with random ids', () => {
    // Arrange, Act
    const agent1 = new MyAIAgent();
    const agent2 = new MyAIAgent();

    // Assert
    expect(agent1.id).not.toEqual(agent2.id);
  });

  it('agent displayName should match id if name is undefined', () => {
    // Arrange, Act
    const agent = new MyAIAgent();

    // Assert
    expect(agent.displayName).toEqual(agent.id);
  });
});
