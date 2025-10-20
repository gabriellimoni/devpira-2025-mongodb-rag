import axios from "axios";
import {
  Conversation,
  ConversationSummary,
  CreateConversationDto,
  EditConversationDto,
  AddMessageDto,
  AddMessageResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const conversationsApi = {
  // Get all conversations
  getConversations: async (): Promise<ConversationSummary[]> => {
    const response = await apiClient.get("/conversations");
    return response.data;
  },

  // Get conversation by ID
  getConversation: async (id: string): Promise<Conversation> => {
    const response = await apiClient.get(`/conversations/${id}`);
    return response.data;
  },

  // Create new conversation
  createConversation: async (
    data: CreateConversationDto
  ): Promise<Conversation> => {
    const response = await apiClient.post("/conversations", data);
    return response.data;
  },

  // Edit conversation
  editConversation: async (
    id: string,
    data: EditConversationDto
  ): Promise<Conversation> => {
    const response = await apiClient.put(`/conversations/${id}`, data);
    return response.data;
  },

  // Add message to conversation
  addMessage: async (
    id: string,
    data: AddMessageDto
  ): Promise<AddMessageResponse> => {
    const response = await apiClient.post(
      `/conversations/${id}/messages`,
      data
    );
    return response.data;
  },
};

export default apiClient;
