import { Module } from '@nestjs/common';
import { EmbeddingProcessorService } from './embedding-processor.service';

@Module({
  providers: [EmbeddingProcessorService],
  exports: [EmbeddingProcessorService],
})
export class EmbeddingProcessorModule {}
