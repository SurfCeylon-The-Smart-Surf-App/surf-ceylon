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
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import BottomSheet, {
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions, StatusBar } from "react-native";
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const { user } = useAuth();
  const bottomSheetRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const snapPoints = useMemo(() => {
    const topOffset = Platform.OS === "ios" ? insets.top : StatusBar.currentHeight || 24;
    const fullHeight = windowHeight - topOffset;
    return [fullHeight];
  }, [windowHeight, insets]);

  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (isVisible && postId) {
      bottomSheetRef.current?.expand();
      fetchComments();
    } else if (!isVisible) {
      bottomSheetRef.current?.close();
      setNewComment("");
      setEditingComment(null);
      setSelectedComment(null);
      setShowActionMenu(false);
      Keyboard.dismiss();
      setKeyboardHeight(0);
    }
  }, [isVisible, postId]);

  const fetchComments = useCallback(async () => {
    if (!postId) return;

    setIsLoading(true);
    try {
      const response = await postsAPI.getComments(postId);
      const fetchedComments = response.data.data.comments || [];
      setComments(fetchedComments);

      if (onCommentCountSync && fetchedComments.length !== commentCount) {
        onCommentCountSync(fetchedComments.length);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      Alert.alert("Error", "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }, [postId, commentCount, onCommentCountSync]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingComment) {
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

        if (isToxic) {
          Alert.alert(
            "Toxic Content Detected",
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
                      onCommentAdded(false);
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
        const response = await postsAPI.addComment(postId, {
          content: newComment.trim(),
        });

        const newCommentData = response.data.data.comment;
        const isToxic = response.data.data.isToxic;
        const confidence = response.data.data.confidence;

        setComments((prev) => [newCommentData, ...prev]);
        setNewComment("");

        if (isToxic) {
          Alert.alert(
            "Toxic Content Detected",
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
                  } catch (error) {
                    console.error("Error deleting toxic comment:", error);
                  }
                },
              },
            ]
          );
        } else {
          if (onCommentAdded) {
            onCommentAdded();
          }
        }
      }
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("inappropriate")
      ) {
        Alert.alert(
          "Inappropriate Content",
          "Your comment contains inappropriate language and cannot be posted. Please revise your message.",
          [{ text: "OK" }]
        );
      } else {
        console.error("Error with comment:", error);
        Alert.alert(
          "Error",
          editingComment ? "Failed to update comment" : "Failed to add comment"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLongPress = useCallback(
    (comment) => {
      const isCommentAuthor = comment.author?._id === user?._id;
      const isPostOwner = postAuthorId === user?._id;

      if (isCommentAuthor || isPostOwner) {
        setSelectedComment(comment);
        setShowActionMenu(true);
      }
    },
    [user?._id, postAuthorId]
  );

  const handleEditComment = useCallback(() => {
    setNewComment(selectedComment.content);
    setEditingComment(selectedComment);
    setShowActionMenu(false);
  }, [selectedComment]);

  const handleDeleteComment = useCallback(() => {
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
                onCommentAdded(false);
              }
            } catch (error) {
              console.error("Error deleting comment:", error);
              Alert.alert("Error", "Failed to delete comment");
            }
          },
        },
      ]
    );
  }, [selectedComment, onCommentAdded]);

  const handleCancelEdit = () => {
    setNewComment("");
    setEditingComment(null);
  };

  const renderComment = useCallback(
    ({ item }) => {
      const isOwnComment = item.author?._id === user?._id;
      const commentAuthor = isOwnComment ? user : item.author;
      const profilePicture = commentAuthor?.profilePicture;

      return (
        <TouchableOpacity
          onLongPress={() => handleLongPress(item)}
          delayLongPress={500}
          activeOpacity={0.7}
        >
          <View
            style={{
              flexDirection: "row",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#f3f4f6",
            }}
          >
            {profilePicture ? (
              <Image
                source={{
                  uri: `${getStaticImageBaseUrl()}${profilePicture}`,
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  marginRight: 12,
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#d1d5db",
                  marginRight: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#4b5563", fontWeight: "600", fontSize: 12 }}>
                  {commentAuthor?.name?.charAt(0) || "U"}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <View
                style={{
                  backgroundColor: "#f3f4f6",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontWeight: "600", color: "#111827", fontSize: 14 }}>
                  {commentAuthor?.name || "Unknown User"}
                </Text>
                <Text style={{ color: "#1f2937", marginTop: 4, fontSize: 14 }}>
                  {item.content}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                  marginLeft: 12,
                }}
              >
                <TouchableOpacity style={{ marginRight: 16 }}>
                  <Text style={{ color: "#4b5563", fontWeight: "500", fontSize: 14 }}>
                    Like
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginRight: 16 }}>
                  <Text style={{ color: "#4b5563", fontWeight: "500", fontSize: 14 }}>
                    Reply
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [user, handleLongPress]
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
        <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
        <Text style={{ color: "#6b7280", marginTop: 8 }}>No comments yet</Text>
        <Text style={{ color: "#9ca3af", fontSize: 14 }}>Be the first to comment</Text>
      </View>
    ),
    []
  );

  const keyExtractor = useCallback((item) => item._id, []);

  const handleSheetChanges = useCallback(
    (index) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const inputContainerHeight = editingComment ? 108 : 60;
  const headerHeight = 53;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: "#ffffff" }}
      handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <View style={{ flex: 1, width: windowWidth }}>
        {/* SECTION 1: Fixed Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
            zIndex: 1,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>
            Comments ({comments.length})
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* SECTION 2: Scrollable Comments (fills remaining space) */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <BottomSheetFlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: inputContainerHeight + 16 }}
            style={{ flex: 1 }}
            removeClippedSubviews={false}
          />
        )}

        {/* SECTION 3: Fixed Input (absolute at bottom) */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            backgroundColor: "#ffffff",
            zIndex: 2,
            paddingBottom: keyboardHeight > 0 ? 0 : undefined,
          }}
        >
          {editingComment && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: "#eff6ff",
                borderTopWidth: 1,
                borderTopColor: "#bfdbfe",
              }}
            >
              <Text style={{ color: "#1d4ed8", fontSize: 14 }}>Editing comment</Text>
              <TouchableOpacity onPress={handleCancelEdit}>
                <Text style={{ color: "#1d4ed8", fontWeight: "600", fontSize: 14 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            {user?.profilePicture ? (
              <Image
                source={{
                  uri: `${getStaticImageBaseUrl()}${user.profilePicture}`,
                }}
                style={{ width: 32, height: 32, borderRadius: 16, marginRight: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#d1d5db",
                  marginRight: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#4b5563", fontWeight: "600", fontSize: 12 }}>
                  {user?.name?.charAt(0) || "U"}
                </Text>
              </View>
            )}

            <View
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 12,
              }}
            >
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={500}
                style={{ color: "#111827", maxHeight: 100 }}
              />
            </View>

            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: newComment.trim() && !isSubmitting ? "#2563eb" : "#d1d5db",
              }}
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
        </View>
      </View>
    </BottomSheet>
  );
};

export default CommentsBottomSheet;
