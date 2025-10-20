import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { EditConversationDto } from './dto/edit-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@Body() createConversationDto: CreateConversationDto) {
    try {
      return this.conversationsService.create(createConversationDto);
    } catch (error) {
      throw new HttpException(
        'Failed to create conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  findAll() {
    try {
      return this.conversationsService.findAll();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch conversations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      const conversation = this.conversationsService.findOne(id);
      if (!conversation) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }
      return conversation;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/messages')
  addMessage(@Param('id') id: string, @Body() addMessageDto: AddMessageDto) {
    try {
      return this.conversationsService.addMessage(id, addMessageDto);
    } catch (error) {
      if (error.message === 'Conversation not found') {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to add message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  edit(
    @Param('id') id: string,
    @Body() editConversationDto: EditConversationDto,
  ) {
    try {
      const conversation = this.conversationsService.edit(
        id,
        editConversationDto,
      );
      return conversation;
    } catch (error) {
      if (error.message === 'Conversation not found') {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to edit conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
