import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { messageAPI } from "../services/messageAPI";
import { useAuth } from "../hooks/useAuth";
import { getStaticImageBaseUrl } from "../utils/networkConfig";

const ChatPage = () => {
  const { conversationId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const { user } = useAuth();
  const flatListRef = useRef();

  // Fetch conversation details and messages
  const fetchMessages = useCallback(
    async (pageNum = 1, refresh = false) => {
      if (pageNum === 1 && !refresh) setLoading(true);

      try {
        const response = await messageAPI.getMessages(conversationId, {
          page: pageNum,
          limit: 50,
        });

        const newMessages = response.data.data.messages || [];

        if (refresh || pageNum === 1) {
          setMessages(newMessages);
        } else {
          setMessages((prev) => [...newMessages, ...prev]);
        }

        setHasMore(response.data.data.hasMore || false);
        setPage(pageNum);

        // Set conversation details from API response
        if (response.data.data.conversation && !conversation) {
          setConversation(response.data.data.conversation);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        Alert.alert("Error", "Failed to load messages");
      } finally {
        setLoading(false);
      }
    },
    [conversationId, conversation, user._id]
  );

  // Send or update message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      if (editingMessage) {
        // Update existing message
        const response = await messageAPI.updateMessage(
          editingMessage._id,
          messageText
        );
        const updatedMessage = response.data.data.message;

        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === editingMessage._id
              ? { ...msg, content: updatedMessage.content, isEdited: true }
              : msg
          )
        );
        setEditingMessage(null);
      } else {
        // Send new message
        const response = await messageAPI.sendMessage(
          conversationId,
          messageText
        );
        const sentMessage = response.data.data.message;

        setMessages((prev) => [...prev, sentMessage]);

        // Scroll to bottom after sending
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Error with message:", error);
      Alert.alert(
        "Error",
        editingMessage ? "Failed to update message" : "Failed to send message"
      );
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = () => {
    if (!loading && hasMore) {
      fetchMessages(page + 1);
    }
  };

  // Handle long press on message
  const handleLongPress = (message) => {
    // Only show menu for own messages
    if (message.sender._id === user._id) {
      setSelectedMessage(message);
      setShowActionMenu(true);
    }
  };

  // Handle edit message
  const handleEditMessage = () => {
    setNewMessage(selectedMessage.content);
    setEditingMessage(selectedMessage);
    setShowActionMenu(false);
  };

  // Handle delete message
  const handleDeleteMessage = async () => {
    setShowActionMenu(false);
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await messageAPI.deleteMessage(selectedMessage._id);
              setMessages((prev) =>
                prev.filter((msg) => msg._id !== selectedMessage._id)
              );
            } catch (error) {
              console.error("Error deleting message:", error);
              Alert.alert("Error", "Failed to delete message");
            }
          },
        },
      ]
    );
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setNewMessage("");
    setEditingMessage(null);
  };

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isOwn = item.sender._id === user._id;
    const prevMessage = messages[index - 1];
    const nextMessage = messages[index + 1];

    // Show date separator
    const showDateSeparator =
      !prevMessage ||
      new Date(item.createdAt).toDateString() !==
        new Date(prevMessage.createdAt).toDateString();

    // Show time if it's the last message from this sender or significant time gap
    const showTime =
      !nextMessage ||
      nextMessage.sender._id !== item.sender._id ||
      new Date(nextMessage.createdAt) - new Date(item.createdAt) >
        5 * 60 * 1000; // 5 minutes

    return (
      <View>
        {showDateSeparator && (
          <View className="items-center my-4">
            <View className="bg-gray-200 rounded-full px-3 py-1">
              <Text className="text-gray-600 text-xs font-medium">
                {formatMessageDate(item.createdAt)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onLongPress={() => handleLongPress(item)}
          delayLongPress={500}
          activeOpacity={0.7}
          className={`flex-row px-4 mb-1 ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          <View
            className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}
          >
            <View
              className={`rounded-2xl px-4 py-2 ${
                isOwn
                  ? "bg-blue-600 rounded-br-md"
                  : "bg-gray-200 rounded-bl-md"
              }`}
            >
              <Text
                className={`text-base ${
                  isOwn ? "text-white" : "text-gray-900"
                }`}
              >
                {item.content}
              </Text>
              {item.isEdited && (
                <Text
                  className={`text-xs mt-1 ${
                    isOwn ? "text-blue-200" : "text-gray-500"
                  }`}
                >
                  (edited)
                </Text>
              )}
            </View>

            {showTime && (
              <Text className="text-gray-500 text-xs mt-1 px-2">
                {formatMessageTime(item.createdAt)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-2">Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={["top"]} className="px-6 pb-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            {conversation?.participant && (
              <TouchableOpacity
                className="flex-row items-center flex-1"
                onPress={() =>
                  router.push(
                    `/userProfile?userId=${conversation.participant._id}`
                  )
                }
              >
                {conversation.participant.profilePicture ? (
                  <Image
                    source={{
                      uri: `${getStaticImageBaseUrl()}${
                        conversation.participant.profilePicture
                      }`,
                    }}
                    className="w-10 h-10 rounded-full mr-3"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-10 h-10 bg-blue-300 rounded-full mr-3 items-center justify-center">
                    <Text className="text-blue-800 font-semibold">
                      {conversation.participant.name?.charAt(0) || "U"}
                    </Text>
                  </View>
                )}

                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white font-semibold text-lg">
                      {conversation.participant.name || "Unknown User"}
                    </Text>
                    {conversation.participant.isVerified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#bfdbfe"
                        className="ml-1"
                      />
                    )}
                  </View>
                  {conversation.participant.username && (
                    <Text className="text-blue-100 text-sm">
                      @{conversation.participant.username}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        inverted={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="chatbubble-outline" size={60} color="#d1d5db" />
            <Text className="text-gray-500 text-lg font-medium mt-4">
              No messages yet
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Start the conversation with a friendly message!
            </Text>
          </View>
        )}
      />

      {/* Message Input */}
      <View className="bg-white border-t border-gray-200">
        {editingMessage && (
          <View className="flex-row items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-200">
            <Text className="text-blue-700 text-sm">Editing message</Text>
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text className="text-blue-700 font-semibold text-sm">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <View className="px-4 py-3">
          <View className="flex-row items-center">
            <View className="flex-1 bg-gray-100 rounded-full flex-row items-center px-4 py-2 mr-3">
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message..."
                className="flex-1 text-gray-900 max-h-20"
                multiline
                placeholderTextColor="#9ca3af"
              />
            </View>

            <TouchableOpacity
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                newMessage.trim() && !sending ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={newMessage.trim() ? "#ffffff" : "#9ca3af"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View className="bg-white rounded-2xl mx-8 w-64 overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center px-4 py-4 border-b border-gray-200"
              onPress={handleEditMessage}
            >
              <Ionicons name="create-outline" size={24} color="#3b82f6" />
              <Text className="ml-3 text-gray-900 text-base font-medium">
                Edit Message
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              onPress={handleDeleteMessage}
            >
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
              <Text className="ml-3 text-red-600 text-base font-medium">
                Delete Message
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default ChatPage;
