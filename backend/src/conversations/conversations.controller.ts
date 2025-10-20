import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { EditConversationDto } from './dto/edit-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async create(@Body() createConversationDto: CreateConversationDto) {
    try {
      return await this.conversationsService.create(createConversationDto);
    } catch (error) {
      throw new HttpException(
        'Failed to create conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.conversationsService.findAll();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch conversations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.conversationsService.findOne(id);
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
  async addMessage(
    @Param('id') id: string,
    @Body() addMessageDto: AddMessageDto,
  ) {
    try {
      return await this.conversationsService.addMessage(id, addMessageDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to add message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async edit(
    @Param('id') id: string,
    @Body() editConversationDto: EditConversationDto,
  ) {
    try {
      return await this.conversationsService.edit(id, editConversationDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to edit conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
