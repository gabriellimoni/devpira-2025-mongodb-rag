import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductReviewDocument = ProductReview & Document;

@Schema({ timestamps: true })
export class ProductReview {
  @Prop({ required: true })
  productSku: string;

  @Prop({ required: true })
  reviewText: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ required: false })
  embedding: number[];
}

export const ProductReviewSchema = SchemaFactory.createForClass(ProductReview);
