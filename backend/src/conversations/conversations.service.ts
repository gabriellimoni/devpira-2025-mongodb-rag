import { Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { EditConversationDto } from './dto/edit-conversation.dto';

@Injectable()
export class ConversationsService {
  // Placeholder data for now
  private conversations = [
    {
      id: '1',
      title: 'Product Reviews Discussion',
      messages: [
        {
          id: '1',
          content:
            "Hello! I'm your AI assistant for product reviews. How can I help you today?",
          sender: 'AI Assistant',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          content: "I'm looking for reviews about the latest smartphones",
          sender: 'User',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Laptop Reviews Chat',
      messages: [
        {
          id: '1',
          content: 'The MacBook Pro is amazing!',
          sender: 'User',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  create(createConversationDto: CreateConversationDto) {
    const newConversation = {
      id: (this.conversations.length + 1).toString(),
      title: createConversationDto.title || 'New Conversation',
      messages: createConversationDto.initialMessage
        ? [
            {
              id: '1',
              content: createConversationDto.initialMessage,
              sender: 'User',
              timestamp: new Date().toISOString(),
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.conversations.push(newConversation);
    return newConversation;
  }

  findAll() {
    return this.conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      lastMessage:
        conv.messages[conv.messages.length - 1]?.content || 'No messages yet',
      timestamp: conv.updatedAt,
      messageCount: conv.messages.length,
    }));
  }

  findOne(id: string) {
    return this.conversations.find((conv) => conv.id === id);
  }

  addMessage(id: string, addMessageDto: AddMessageDto) {
    const conversation = this.conversations.find((conv) => conv.id === id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const newMessage = {
      id: (conversation.messages.length + 1).toString(),
      content: addMessageDto.content,
      sender: addMessageDto.sender,
      timestamp: new Date().toISOString(),
    };

    conversation.messages.push(newMessage);
    conversation.updatedAt = new Date().toISOString();

    return {
      message: newMessage,
      conversation: conversation,
    };
  }

  edit(id: string, editConversationDto: EditConversationDto) {
    const conversation = this.conversations.find((conv) => conv.id === id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.title = editConversationDto.title;
    conversation.updatedAt = new Date().toISOString();

    return conversation;
  }
}
