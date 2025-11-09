import { DocumentInterface } from '@langchain/core/documents';
import { Annotation, StateGraph } from '@langchain/langgraph';
import { Inject } from '@nestjs/common';
import { RagService } from './rag.service';

// Define the state for our RAG workflow using Annotation
const RagState = Annotation.Root({
  userMessage: Annotation<string>,
  conversationHistory: Annotation<{ content: string; sender: string }[]>,
  retrievedDocuments: Annotation<DocumentInterface[]>,
  generatedResponse: Annotation<string>,
});

export class RagWorkflow {
  private graph: StateGraph<
    (typeof RagState)['spec'],
    (typeof RagState)['State'],
    (typeof RagState)['Update'],
    // specify nodes beforehand & preserve intellisense
    'retrieve_documents' | 'generate_response'
  >;

  constructor(@Inject() private readonly ragService: RagService) {
    this.setupWorkflow();
  }

  private setupWorkflow() {
    // Create the workflow using annotation root with StateGraph
    this.graph = new StateGraph(RagState);

    // Add nodes to the workflow
    this.graph.addNode('retrieve_documents', this.retrieveDocuments.bind(this));
    this.graph.addNode('generate_response', this.generateResponse.bind(this));

    // Define the workflow edges
    this.graph.addEdge('__start__', 'retrieve_documents');
    this.graph.addEdge('retrieve_documents', 'generate_response');
    this.graph.addEdge('generate_response', '__end__');
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
        state.retrievedDocuments,
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

  async run(
    userMessage: string,
    conversationHistory: { content: string; sender: string }[],
  ): Promise<{
    response: string;
  }> {
    const initialState: typeof RagState.State = {
      userMessage,
      conversationHistory,
      retrievedDocuments: [],
      generatedResponse: '',
    };

    const result = await this.graph.compile().invoke(initialState);

    return {
      response: result.generatedResponse,
    };
  }
}
