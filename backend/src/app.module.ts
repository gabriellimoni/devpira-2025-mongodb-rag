import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConversationsModule } from './conversations/conversations.module';
import { EmbeddingProcessorModule } from './embedding-processor/embedding-processor.module';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService) => ({
        uri:
          configService.get('MONGODB_URI') ||
          'mongodb://localhost:27017/rag-chat',
      }),
      inject: [ConfigService],
    }),
    ConversationsModule,
    EmbeddingProcessorModule,
    RagModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
