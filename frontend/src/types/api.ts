export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

export interface CreateConversationDto {
  title?: string;
  initialMessage?: string;
}

export interface EditConversationDto {
  title: string;
}

export interface AddMessageDto {
  content: string;
  sender: string;
}

export interface AddMessageResponse {
  message: Message;
  conversation: Conversation;
}
