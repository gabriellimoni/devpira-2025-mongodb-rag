import { Annotation, StateGraph, END } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { RagService } from './rag.service';
import { Inject } from '@nestjs/common';

// Define the state for our RAG workflow using Annotation
const RagState = Annotation.Root({
  userMessage: Annotation<string>,
  conversationHistory: Annotation<any[]>,
  retrievedDocuments: Annotation<any[]>,
  generatedResponse: Annotation<string>,
  messages: Annotation<BaseMessage[]>,
});

export class RagWorkflow {
  private graph: any;

  constructor(@Inject() private readonly ragService: RagService) {
    this.setupWorkflow();
  }

  private setupWorkflow() {
    // Create the workflow using annotation root with StateGraph
    const workflow = new StateGraph(RagState);

    // Add nodes to the workflow
    workflow.addNode('retrieve_documents', this.retrieveDocuments.bind(this));
    workflow.addNode('generate_response', this.generateResponse.bind(this));
    workflow.addNode('format_messages', this.formatMessages.bind(this));

    // Define the workflow edges
    (workflow as any).addEdge('__start__', 'retrieve_documents');
    (workflow as any).addEdge('retrieve_documents', 'generate_response');
    (workflow as any).addEdge('generate_response', 'format_messages');
    (workflow as any).addEdge('format_messages', END);

    // Compile the graph
    this.graph = workflow.compile();
  }

  private async retrieveDocuments(
    state: typeof RagState.State,
  ): Promise<Partial<typeof RagState.State>> {
    try {
      const relevantDocs = await this.ragService.searchRelevantReviews(
        state.userMessage,
        50,
      );
      return {
        retrievedDocuments: relevantDocs,
      };
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return {
        retrievedDocuments: [],
      };
    }
  }

  private async generateResponse(
    state: typeof RagState.State,
  ): Promise<Partial<typeof RagState.State>> {
    try {
      const response = await this.ragService.generateResponse(
        state.userMessage,
        state.conversationHistory,
      );
      return {
        generatedResponse: response,
      };
    } catch (error) {
      console.error('Error generating response:', error);
      return {
        generatedResponse:
          "I apologize, but I'm having trouble processing your request right now.",
      };
    }
  }

  private async formatMessages(
    state: typeof RagState.State,
  ): Promise<Partial<typeof RagState.State>> {
    const messages: BaseMessage[] = [];

    // Add conversation history as messages
    for (const msg of state.conversationHistory) {
      if (msg.sender === 'User') {
        messages.push(new HumanMessage(msg.content));
      } else {
        messages.push(new AIMessage(msg.content));
      }
    }

    // Add the current user message
    messages.push(new HumanMessage(state.userMessage));

    // Add the generated response
    messages.push(new AIMessage(state.generatedResponse));

    return {
      messages,
    };
  }

  async run(
    userMessage: string,
    conversationHistory: any[],
  ): Promise<{
    response: string;
    retrievedDocuments: any[];
    messages: BaseMessage[];
  }> {
    const initialState: typeof RagState.State = {
      userMessage,
      conversationHistory,
      retrievedDocuments: [],
      generatedResponse: '',
      messages: [],
    };

    const result = await this.graph.invoke(initialState);

    return {
      response: result.generatedResponse,
      retrievedDocuments: result.retrievedDocuments || [],
      messages: result.messages || [],
    };
  }
}
