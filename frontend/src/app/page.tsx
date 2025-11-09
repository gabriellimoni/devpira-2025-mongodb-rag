"use client";

import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  ConversationHeader,
  Sidebar,
  ConversationList,
  Conversation,
  Avatar,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { useState, useEffect } from "react";
import {
  useConversations,
  useConversation,
  useOptimisticAddMessage,
  useCreateConversation,
  useEditConversation,
} from "@/hooks/useConversations";
import { ChatProvider, useChat } from "@/contexts/ChatContext";
import { Message as MessageType } from "@/types/api";

function ChatInterface() {
  const { activeConversationId, setActiveConversationId } = useChat();
  const [messageInputValue, setMessageInputValue] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");

  // Fetch conversations list
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useConversations();

  // Fetch active conversation details
  const {
    data: activeConversation,
    isLoading: conversationLoading,
    error: conversationError,
  } = useConversation(activeConversationId || "");

  // Add message mutation
  const addMessageMutation = useOptimisticAddMessage();

  // Create conversation mutation
  const createConversationMutation = useCreateConversation();

  // Edit conversation mutation
  const editConversationMutation = useEditConversation();

  const handleSend = async (message: string) => {
    if (!activeConversationId || !message.trim()) return;

    try {
      await addMessageMutation.mutateAsync({
        id: activeConversationId,
        data: {
          content: message,
          sender: "User",
        },
      });
      setMessageInputValue("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const newConversation = await createConversationMutation.mutateAsync({
        title: "New Conversation",
      });
      setActiveConversationId(newConversation.id);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleStartEditTitle = () => {
    if (activeConversation) {
      setEditingTitle(activeConversation.title);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = async () => {
    if (!activeConversationId || !editingTitle.trim()) return;

    try {
      await editConversationMutation.mutateAsync({
        id: activeConversationId,
        data: { title: editingTitle.trim() },
      });
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEditTitle();
    }
  };

  // Convert API messages to chat UI format
  const formatMessages = (messages: MessageType[]) => {
    return messages.map((msg) => ({
      message: msg.content,
      sentTime: new Date(msg.timestamp).toLocaleTimeString(),
      sender: msg.sender,
      direction: (msg.sender === "User" ? "outgoing" : "incoming") as
        | "incoming"
        | "outgoing",
      position: "single" as const,
    }));
  };

  // Format conversation list for sidebar
  const formatConversations = (conversations: any[]) => {
    return conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      lastActivityTime: new Date(conv.timestamp).toLocaleString(),
    }));
  };

  if (conversationsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (conversationsError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Failed to load conversations
          </h2>
          <p className="text-gray-600">
            Please check if the backend is running on port 3001
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <MainContainer>
        <Sidebar position="left" scrollable={false}>
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleCreateConversation}
              disabled={createConversationMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {createConversationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Conversation
                </>
              )}
            </button>
          </div>
          <ConversationList>
            {formatConversations(conversations).map((conv) => (
              <Conversation
                key={conv.id}
                name={conv.title}
                lastActivityTime={conv.lastActivityTime}
                active={activeConversationId === conv.id}
                onClick={() => setActiveConversationId(conv.id)}
              >
                <Avatar src="avatar.png" name={conv.title} status="available" />
              </Conversation>
            ))}
          </ConversationList>
        </Sidebar>

        <ChatContainer>
          <ConversationHeader>
            <ConversationHeader.Back />
            <Avatar src="avatar.png" name="AI Assistant" />
            <ConversationHeader.Content
              userName={
                isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={handleSaveTitle}
                      className="bg-transparent border-none outline-none text-inherit font-inherit text-sm px-1 py-0.5 rounded"
                      autoFocus
                      disabled={editConversationMutation.isPending}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={handleSaveTitle}
                        disabled={editConversationMutation.isPending}
                        className="p-1 hover:bg-gray-200 rounded text-green-600 disabled:opacity-50"
                        title="Save"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelEditTitle}
                        disabled={editConversationMutation.isPending}
                        className="p-1 hover:bg-gray-200 rounded text-red-600 disabled:opacity-50"
                        title="Cancel"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span>{activeConversation?.title || "AI Assistant"}</span>
                    {activeConversation && (
                      <button
                        onClick={handleStartEditTitle}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-600 transition-opacity"
                        title="Edit title"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              }
              info="Online"
            />
          </ConversationHeader>

          <MessageList>
            {conversationLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : conversationError ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-center">
                  <p className="text-red-500">Failed to load conversation</p>
                </div>
              </div>
            ) : activeConversation ? (
              formatMessages(activeConversation.messages).map((message, i) => (
                <Message key={i} model={message} />
              ))
            ) : (
              <div className="flex justify-center items-center h-32">
                <p className="text-gray-500">
                  Select a conversation to start chatting
                </p>
              </div>
            )}

            {addMessageMutation.isPending && (
              <Message
                model={{
                  message: "Sending...",
                  sentTime: "now",
                  sender: "System",
                  direction: "incoming",
                  position: "single",
                }}
              />
            )}
          </MessageList>

          <MessageInput
            placeholder="Type message here"
            value={messageInputValue}
            onChange={(val) => setMessageInputValue(val)}
            onSend={(_, text) => handleSend(text)}
            attachButton={false}
            disabled={!activeConversationId || addMessageMutation.isPending}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}

export default function Home() {
  return (
    <ChatProvider>
      <ChatInterface />
    </ChatProvider>
  );
}
