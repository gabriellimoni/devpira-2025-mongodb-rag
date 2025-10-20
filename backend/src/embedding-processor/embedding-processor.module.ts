import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmbeddingProcessorService } from './embedding-processor.service';
import {
  ProductReview,
  ProductReviewSchema,
} from './schemas/product-review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductReview.name, schema: ProductReviewSchema },
    ]),
  ],
  providers: [EmbeddingProcessorService],
  exports: [EmbeddingProcessorService],
})
export class EmbeddingProcessorModule {}
