import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  ProductReview,
  ProductReviewDocument,
} from './schemas/product-review.schema';

@Injectable()
export class EmbeddingProcessorService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingProcessorService.name);
  private embeddings: OpenAIEmbeddings;

  constructor(
    @InjectModel(ProductReview.name)
    private productReviewModel: Model<ProductReviewDocument>,
    private configService: ConfigService,
  ) {
    // Initialize OpenAI embeddings with text-embedding-3-small model
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      openAIApiKey: openaiApiKey,
      dimensions: 1536,
    });
  }

  async onModuleInit() {
    this.productReviewModel.watch().on('change', async (data) => {
      // Only process insertions
      if (data.operationType !== 'insert') return;

      const productReview = data.fullDocument;
      await this.processProductReview(productReview);
    });
  }

  async processProductReview(productReview: ProductReviewDocument) {
    try {
      this.logger.log(`Processing product review: ${productReview._id}`);
      const { embeddingResult, textToEmbed } =
        await this.generateEmbedding(productReview);
      await this.productReviewModel.findByIdAndUpdate(productReview._id, {
        embedding: embeddingResult,
        embeddingText: textToEmbed,
      });
      this.logger.log(
        `Successfully processed and updated product review: ${productReview._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process product review ${productReview._id}:`,
        error,
      );
      // Don't rethrow to prevent the change stream from crashing
    }
  }

  async generateEmbedding(
    productReview: ProductReviewDocument,
  ): Promise<{ embeddingResult: number[]; textToEmbed: string }> {
    try {
      this.logger.log(
        `Generating embedding for product review: ${productReview._id}`,
      );

      // Create text to embed - combine product SKU and review text for better context
      const textToEmbed = `Product: ${productReview.productSku}\nReview: ${productReview.reviewText}`;

      // Generate embedding using OpenAI text-embedding-3-small
      const embeddingResult = await this.embeddings.embedQuery(textToEmbed);

      this.logger.log(
        `Successfully generated embedding with ${embeddingResult.length} dimensions`,
      );
      return { embeddingResult, textToEmbed };
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding for product review ${productReview._id}:`,
        error,
      );
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }
}
