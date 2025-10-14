import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { postsAPI } from "../services/api";
import { getStaticImageBaseUrl } from "../utils/networkConfig";

const CommentsBottomSheet = ({
  isVisible,
  onClose,
  postId,
  postAuthorId,
  commentCount = 0,
  onCommentAdded,
  onCommentCountSync,
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);

  const { user } = useAuth();
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["25%", "75%"], []);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
      fetchComments();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const fetchComments = async () => {
    if (!postId) return;

    setIsLoading(true);
    try {
      const response = await postsAPI.getComments(postId);
      const fetchedComments = response.data.data.comments || [];
      setComments(fetchedComments);

      // Sync the actual comment count with parent
      if (onCommentCountSync && fetchedComments.length !== commentCount) {
        onCommentCountSync(fetchedComments.length);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      Alert.alert("Error", "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingComment) {
        // Update existing comment
        const response = await postsAPI.updateComment(editingComment._id, {
          content: newComment.trim(),
        });

        const updatedComment = response.data.data.comment;
        const isToxic = response.data.data.isToxic;
        const confidence = response.data.data.confidence;

        setComments((prev) =>
          prev.map((c) => (c._id === editingComment._id ? updatedComment : c))
        );
        setNewComment("");
        setEditingComment(null);

        // Show toxicity warning if detected and delete comment
        if (isToxic) {
          Alert.alert(
            "⚠️ Toxic Content Detected",
            `Your comment contains inappropriate or offensive language (${(
              confidence * 100
            ).toFixed(1)}% confidence). The comment will be removed.`,
            [
              {
                text: "OK",
                onPress: async () => {
                  try {
                    await postsAPI.deleteComment(updatedComment._id);
                    setComments((prev) =>
                      prev.filter((c) => c._id !== updatedComment._id)
                    );
                    if (onCommentAdded) {
                      onCommentAdded(false); // Decrement count
                    }
                  } catch (error) {
                    console.error("Error deleting toxic comment:", error);
                  }
                },
              },
            ]
          );
        }
      } else {
        // Add new comment
        const response = await postsAPI.addComment(postId, {
          content: newComment.trim(),
        });

        const newCommentData = response.data.data.comment;
        const isToxic = response.data.data.isToxic;
        const confidence = response.data.data.confidence;

        setComments((prev) => [newCommentData, ...prev]);
        setNewComment("");

        // Show toxicity warning if detected and delete comment
        if (isToxic) {
          Alert.alert(
            "⚠️ Toxic Content Detected",
            `Your comment contains inappropriate or offensive language (${(
              confidence * 100
            ).toFixed(1)}% confidence). The comment will be removed.`,
            [
              {
                text: "OK",
                onPress: async () => {
                  try {
                    await postsAPI.deleteComment(newCommentData._id);
                    setComments((prev) =>
                      prev.filter((c) => c._id !== newCommentData._id)
                    );
                    // Don't notify parent since we're removing it
                  } catch (error) {
                    console.error("Error deleting toxic comment:", error);
                  }
                },
              },
            ]
          );
        } else {
          // Only notify parent if comment is not toxic
          if (onCommentAdded) {
            onCommentAdded();
          }
        }
      }
    } catch (error) {
      console.error("Error with comment:", error);
      Alert.alert(
        "Error",
        editingComment ? "Failed to update comment" : "Failed to add comment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLongPress = (comment) => {
    const isCommentAuthor = comment.author._id === user?._id;
    const isPostOwner = postAuthorId === user?._id;

    if (isCommentAuthor || isPostOwner) {
      setSelectedComment(comment);
      setShowActionMenu(true);
    }
  };

  const handleEditComment = () => {
    setNewComment(selectedComment.content);
    setEditingComment(selectedComment);
    setShowActionMenu(false);
  };

  const handleDeleteComment = async () => {
    setShowActionMenu(false);
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await postsAPI.deleteComment(selectedComment._id);
              setComments((prev) =>
                prev.filter((c) => c._id !== selectedComment._id)
              );
              if (onCommentAdded) {
                onCommentAdded(false); // Pass false to decrement
              }
            } catch (error) {
              console.error("Error deleting comment:", error);
              Alert.alert("Error", "Failed to delete comment");
            }
          },
        },
      ]
    );
  };

  const handleCancelEdit = () => {
    setNewComment("");
    setEditingComment(null);
  };

  const renderComment = ({ item }) => {
    // Use current user data if this comment is from the logged-in user
    const isOwnComment = item.author?._id === user?._id;
    const commentAuthor = isOwnComment ? user : item.author;
    const profilePicture = commentAuthor?.profilePicture;

    return (
      <TouchableOpacity
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View className="flex-row p-4 border-b border-gray-100">
          {/* Avatar */}
          {profilePicture ? (
            <Image
              source={{ uri: `${getStaticImageBaseUrl()}${profilePicture}` }}
              className="w-8 h-8 rounded-full mr-3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-8 h-8 bg-gray-300 rounded-full mr-3 items-center justify-center">
              <Text className="text-gray-600 font-semibold text-xs">
                {commentAuthor?.name?.charAt(0) || "U"}
              </Text>
            </View>
          )}

          {/* Comment Content */}
          <View className="flex-1">
            <View className="bg-gray-100 rounded-xl px-3 py-2">
              <Text className="font-semibold text-gray-900 text-sm">
                {commentAuthor?.name || "Unknown User"}
              </Text>
              <Text className="text-gray-800 mt-1">{item.content}</Text>
            </View>

            {/* Comment Actions */}
            <View className="flex-row items-center mt-2 ml-3">
              <TouchableOpacity className="mr-4">
                <Text className="text-gray-600 font-medium text-sm">Like</Text>
              </TouchableOpacity>
              <TouchableOpacity className="mr-4">
                <Text className="text-gray-600 font-medium text-sm">Reply</Text>
              </TouchableOpacity>
              <Text className="text-gray-500 text-xs">
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleSheetChanges = useCallback(
    (index) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: "#ffffff" }}
      handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
    >
      <BottomSheetView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">
            Comments ({comments.length})
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View className="flex-1 items-center justify-center py-12">
                  <Ionicons
                    name="chatbubble-outline"
                    size={48}
                    color="#d1d5db"
                  />
                  <Text className="text-gray-500 mt-2">No comments yet</Text>
                  <Text className="text-gray-400 text-sm">
                    Be the first to comment
                  </Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Comment Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={100}
        >
          {editingComment && (
            <View className="flex-row items-center justify-between px-4 py-2 bg-blue-50 border-t border-blue-200">
              <Text className="text-blue-700 text-sm">Editing comment</Text>
              <TouchableOpacity onPress={handleCancelEdit}>
                <Text className="text-blue-700 font-semibold text-sm">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-white">
            {/* User Avatar */}
            {user?.profilePicture ? (
              <Image
                source={{
                  uri: `${getStaticImageBaseUrl()}${user.profilePicture}`,
                }}
                className="w-8 h-8 rounded-full mr-3"
                resizeMode="cover"
              />
            ) : (
              <View className="w-8 h-8 bg-gray-300 rounded-full mr-3 items-center justify-center">
                <Text className="text-gray-600 font-semibold text-xs">
                  {user?.name?.charAt(0) || "U"}
                </Text>
              </View>
            )}

            {/* Text Input */}
            <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3">
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={500}
                className="text-gray-900"
                style={{ maxHeight: 100 }}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              className={`w-8 h-8 rounded-full items-center justify-center ${
                newComment.trim() && !isSubmitting
                  ? "bg-blue-600"
                  : "bg-gray-300"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons
                  name="send"
                  size={16}
                  color={newComment.trim() ? "#ffffff" : "#9ca3af"}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

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
              {selectedComment?.author._id === user?._id && (
                <TouchableOpacity
                  className="flex-row items-center px-4 py-4 border-b border-gray-200"
                  onPress={handleEditComment}
                >
                  <Ionicons name="create-outline" size={24} color="#3b82f6" />
                  <Text className="ml-3 text-gray-900 text-base font-medium">
                    Edit Comment
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="flex-row items-center px-4 py-4"
                onPress={handleDeleteComment}
              >
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
                <Text className="ml-3 text-red-600 text-base font-medium">
                  Delete Comment
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default CommentsBottomSheet;
