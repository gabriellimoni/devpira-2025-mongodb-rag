import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductReview,
  ProductReviewDocument,
} from './schemas/product-review.schema';

@Injectable()
export class EmbeddingProcessorService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingProcessorService.name);

  constructor(
    @InjectModel(ProductReview.name)
    private productReviewModel: Model<ProductReviewDocument>,
  ) {}

  async onModuleInit() {
    this.productReviewModel.watch().on('change', async (data) => {
      // Only process insertions
      if (data.operationType !== 'insert') return;

      const productReview = data.fullDocument;
      console.log(productReview);
      await this.processProductReview(productReview);
    });
  }

  async processProductReview(productReview: ProductReviewDocument) {
    const embedding = await this.generateEmbedding(productReview);
    await this.productReviewModel.findByIdAndUpdate(productReview._id, {
      embedding,
    });
  }

  async generateEmbedding(productReview: ProductReviewDocument) {
    return [1, 2, 3, 4, 5];
  }
}
