import { DocumentInterface } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getMongoClient } from 'src/mongo';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private llm: ChatOpenAI;
  private vectorStore: MongoDBAtlasVectorSearch;
  private embeddings: OpenAIEmbeddings;

  constructor(private configService: ConfigService) {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    // Initialize embeddings
    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      openAIApiKey: openaiApiKey,
      dimensions: 1536,
    });

    this.llm = new ChatOpenAI({
      modelName: 'gpt-4.1-nano-2025-04-14',
      openAIApiKey: openaiApiKey,
      temperature: 0.1,
    });
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: { content: string; sender: string }[],
    relevantDocs: DocumentInterface[],
  ): Promise<string> {
    try {
      this.logger.log('Generating RAG response for user message');

      // Create context from retrieved documents
      const context = relevantDocs
        .map((doc) => `${doc.pageContent} | DB ID:${doc.metadata._id}`)
        .join('\n\n');

      // Create conversation history context
      const conversationContext = conversationHistory
        .slice(-10) // Keep last 10 messages for context
        .map((msg) => `${msg.sender}: ${msg.content}`)
        .join('\n');
      console.log(conversationContext);

      // Create prompt template
      const prompt = ChatPromptTemplate.fromTemplate(`
You are a helpful assistant that provides information based on product reviews and user conversations.

Context from product reviews:
{context}

Recent conversation history:
{conversationHistory}

User's current message: {userMessage}

Please provide a helpful response based on the context and conversation history. If the user is asking about products, use the review information to provide insights. Be conversational and helpful.

Response:
`);

      // Create the chain
      const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

      // Generate response
      const response = await chain.invoke({
        context,
        conversationHistory: conversationContext,
        userMessage,
      });

      this.logger.log('Successfully generated RAG response');
      return response;
    } catch (error) {
      this.logger.error('Error generating RAG response:', error);
      // Fallback response if RAG fails
      return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
    }
  }

  async searchRelevantReviews(query: string, msgScore: number = 0.5) {
    try {
      const client = await getMongoClient();
      const db = client.db('rag-chat');
      const collection = db.collection('productreviews');
      this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddings, {
        collection: collection,
        indexName: 'product_reviews_index_embedding',
        embeddingKey: 'embedding',
        textKey: 'embeddingText',
      });
      const results = await this.vectorStore.similaritySearchWithScore(
        query,
        100,
      );
      const highScore = results
        .filter(([_, score]) => score > msgScore)
        .map(([doc]) => doc);
      console.log('HIGH SCORE RESULTS COUNT:', highScore.length);
      return highScore;
      // const results = await this.vectorStore.similaritySearch(query, limit);
      // return results;
    } catch (error) {
      this.logger.error('Error searching relevant reviews:', error);
      return [];
    }
  }
}
