import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatOpenAI, OpenAI } from '@langchain/openai';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  ProductReview,
  ProductReviewDocument,
} from '../embedding-processor/schemas/product-review.schema';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { MongoClient } from 'mongodb';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private llm: ChatOpenAI;
  private vectorStore: MongoDBAtlasVectorSearch;
  private embeddings: OpenAIEmbeddings;

  constructor(
    @InjectModel(ProductReview.name)
    private productReviewModel: Model<ProductReviewDocument>,
    private configService: ConfigService,
  ) {
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
    conversationHistory: any[],
  ): Promise<string> {
    try {
      this.logger.log('Generating RAG response for user message');
      const client = await MongoClient.connect(
        this.configService.get('MONGODB_URI') || '',
      );
      const db = client.db('rag-chat');
      const collection = db.collection('productreviews');
      this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddings, {
        collection: collection,
        indexName: 'product_reviews_index_embedding',
        embeddingKey: 'embedding',
        textKey: 'reviewText',
      });

      // Retrieve relevant documents using vector search
      const relevantDocs = await this.vectorStore.similaritySearch(
        userMessage,
        5,
      );
      console.log(relevantDocs);

      this.logger.log(`Found ${relevantDocs.length} relevant documents`);

      // Create context from retrieved documents
      const context = relevantDocs
        .map((doc, index) => `Document ${index + 1}:\n${doc.pageContent}`)
        .join('\n\n');

      // Create conversation history context
      const conversationContext = conversationHistory
        .slice(-10) // Keep last 10 messages for context
        .map((msg) => `${msg.sender}: ${msg.content}`)
        .join('\n');

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

  async searchRelevantReviews(query: string, limit: number = 5) {
    try {
      const client = await MongoClient.connect(
        this.configService.get('MONGODB_URI') || '',
      );
      const db = client.db('rag-chat');
      const collection = db.collection('productreviews');
      this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddings, {
        collection: collection,
        indexName: 'vector_index',
        textKey: 'text',
        embeddingKey: 'embedding',
      });
      const results = await this.vectorStore.similaritySearch(query, limit);
      return results.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      }));
    } catch (error) {
      this.logger.error('Error searching relevant reviews:', error);
      return [];
    }
  }
}
