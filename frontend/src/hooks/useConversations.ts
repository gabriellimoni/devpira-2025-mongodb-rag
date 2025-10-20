import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsApi } from "@/lib/api";
import {
  Conversation,
  ConversationSummary,
  CreateConversationDto,
  EditConversationDto,
  AddMessageDto,
} from "@/types/api";

// Query keys
export const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  list: (filters: string) =>
    [...conversationKeys.lists(), { filters }] as const,
  details: () => [...conversationKeys.all, "detail"] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
};

// Get all conversations
export function useConversations() {
  return useQuery({
    queryKey: conversationKeys.lists(),
    queryFn: conversationsApi.getConversations,
  });
}

// Get conversation by ID
export function useConversation(id: string) {
  return useQuery({
    queryKey: conversationKeys.detail(id),
    queryFn: () => conversationsApi.getConversation(id),
    enabled: !!id,
  });
}

// Create conversation mutation
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversationsApi.createConversation,
    onSuccess: (newConversation) => {
      // Invalidate and refetch conversations list
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });

      // Add the new conversation to the cache
      queryClient.setQueryData(
        conversationKeys.detail(newConversation.id),
        newConversation
      );
    },
  });
}

// Edit conversation mutation
export function useEditConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditConversationDto }) =>
      conversationsApi.editConversation(id, data),
    onSuccess: (updatedConversation) => {
      // Update the specific conversation in cache
      queryClient.setQueryData(
        conversationKeys.detail(updatedConversation.id),
        updatedConversation
      );

      // Invalidate conversations list to update the title
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

// Add message mutation
export function useAddMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddMessageDto }) =>
      conversationsApi.addMessage(id, data),
    onSuccess: (response, variables) => {
      // Update the specific conversation in cache
      queryClient.setQueryData(
        conversationKeys.detail(variables.id),
        response.conversation
      );

      // Invalidate conversations list to update last message
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

// Optimistic message addition
export function useOptimisticAddMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddMessageDto }) =>
      conversationsApi.addMessage(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.detail(id),
      });

      // Snapshot the previous value
      const previousConversation = queryClient.getQueryData<Conversation>(
        conversationKeys.detail(id)
      );

      // Optimistically update the conversation
      if (previousConversation) {
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          content: data.content,
          sender: data.sender,
          timestamp: new Date().toISOString(),
        };

        const optimisticConversation = {
          ...previousConversation,
          messages: [...previousConversation.messages, optimisticMessage],
          updatedAt: new Date().toISOString(),
        };

        queryClient.setQueryData(
          conversationKeys.detail(id),
          optimisticConversation
        );
      }

      // Return a context object with the snapshotted value
      return { previousConversation };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousConversation) {
        queryClient.setQueryData(
          conversationKeys.detail(variables.id),
          context.previousConversation
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}
