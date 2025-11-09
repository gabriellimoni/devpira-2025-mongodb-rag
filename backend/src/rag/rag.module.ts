import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductReview,
  ProductReviewSchema,
} from '../embedding-processor/schemas/product-review.schema';
import { RagWorkflow } from './rag-workflow';
import { RagService } from './rag.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductReview.name, schema: ProductReviewSchema },
    ]),
  ],
  providers: [RagService, RagWorkflow],
  exports: [RagService, RagWorkflow],
})
export class RagModule {}
