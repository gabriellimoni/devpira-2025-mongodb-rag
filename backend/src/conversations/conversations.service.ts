import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { EditConversationDto } from './dto/edit-conversation.dto';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { RagWorkflow } from '../rag/rag-workflow';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    private ragWorkflow: RagWorkflow,
  ) {}

  async create(createConversationDto: CreateConversationDto) {
    try {
      const newConversation = new this.conversationModel({
        title: createConversationDto.title || 'New Conversation',
        messages: createConversationDto.initialMessage
          ? [
              {
                content: createConversationDto.initialMessage,
                sender: 'User',
              },
            ]
          : [],
      });

      const savedConversation = await newConversation.save();
      return savedConversation.toObject();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      const conversations = await this.conversationModel
        .find()
        .sort({ updatedAt: -1 })
        .exec();

      return conversations.map((conv) => ({
        id: (conv._id as any).toString(),
        title: conv.title,
        lastMessage:
          conv.messages[conv.messages.length - 1]?.content || 'No messages yet',
        timestamp: conv.updatedAt,
        messageCount: conv.messages.length,
      }));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    const conversation = await this.conversationModel.findById(id).exec();
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation.toObject();
  }

  async addMessage(id: string, addMessageDto: AddMessageDto) {
    const newMessage = {
      content: addMessageDto.content,
      sender: addMessageDto.sender,
    };

    // First, add the user message to the conversation
    let conversation = await this.conversationModel
      .findByIdAndUpdate(
        id,
        {
          $push: { messages: newMessage },
          $set: { updatedAt: new Date() },
        },
        { new: true },
      )
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // If the message is from a user, generate an AI response using RAG
    if (addMessageDto.sender === 'User') {
      try {
        // Run the RAG workflow to generate a response
        const ragResult = await this.ragWorkflow.run(
          addMessageDto.content,
          conversation.messages,
        );

        // Create the AI response message
        const aiMessage = {
          content: ragResult.response,
          sender: 'AI',
        };

        // Add the AI response to the conversation
        conversation = await this.conversationModel
          .findByIdAndUpdate(
            id,
            {
              $push: { messages: aiMessage },
              $set: { updatedAt: new Date() },
            },
            { new: true },
          )
          .exec();

        return {
          userMessage: newMessage,
          aiMessage: aiMessage,
          conversation: conversation?.toObject(),
          retrievedDocuments: ragResult.retrievedDocuments,
        };
      } catch (error) {
        console.error('Error generating AI response:', error);

        // If RAG fails, add a fallback message
        const fallbackMessage = {
          content:
            "I apologize, but I'm having trouble processing your request right now. Please try again later.",
          sender: 'AI',
        };

        conversation = await this.conversationModel
          .findByIdAndUpdate(
            id,
            {
              $push: { messages: fallbackMessage },
              $set: { updatedAt: new Date() },
            },
            { new: true },
          )
          .exec();

        return {
          userMessage: newMessage,
          aiMessage: fallbackMessage,
          conversation: conversation?.toObject(),
          retrievedDocuments: [],
        };
      }
    }

    // If not a user message, just return the original message
    return {
      message: newMessage,
      conversation: conversation.toObject(),
    };
  }

  async edit(id: string, editConversationDto: EditConversationDto) {
    const conversation = await this.conversationModel
      .findByIdAndUpdate(
        id,
        {
          title: editConversationDto.title,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation.toObject();
  }
}
