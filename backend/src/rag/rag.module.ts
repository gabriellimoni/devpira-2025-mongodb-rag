import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RagService } from './rag.service';
import { RagWorkflow } from './rag-workflow';
import {
  ProductReview,
  ProductReviewSchema,
} from '../embedding-processor/schemas/product-review.schema';

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
