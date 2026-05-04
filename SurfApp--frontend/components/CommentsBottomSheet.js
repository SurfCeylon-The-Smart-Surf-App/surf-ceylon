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
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Modal,
} from "react-native";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetFooter,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { postsAPI } from "../services/api";
import { getStaticImageBaseUrl } from "../utils/networkConfig";

const CommentInput = ({
  user,
  onSubmit,
  isSubmitting,
  initialText = "",
  replyingTo,
  editingComment,
  onCancel,
}) => {
  const [text, setText] = useState(initialText);
  const inputRef = useRef(null);
  const textRef = useRef(initialText);

  useEffect(() => {
    setText(initialText);
    textRef.current = initialText;
    if (initialText) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [initialText]);

  const handleChangeText = (val) => {
    setText(val);
    textRef.current = val;
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
    textRef.current = "";
  };

  const handleCancel = () => {
    setText("");
    textRef.current = "";
    onCancel();
  };

  const isActionMode = editingComment || replyingTo;

  return (
    <View style={styles.inputContainer}>
      {isActionMode && (
        <View
          style={[
            styles.actionModeBar,
            {
              backgroundColor: editingComment ? COLORS.editBg : COLORS.replyModeBg,
              borderTopColor: editingComment ? COLORS.editBorder : COLORS.replyModeBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.actionModeText,
              { color: editingComment ? "#F59E0B" : "#10B981" },
            ]}
            numberOfLines={1}
          >
            {editingComment
              ? "Editing comment"
              : `Replying to ${replyingTo?.author?.name || "User"}`}
          </Text>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.actionModeCancel}
            activeOpacity={0.6}
          >
            <Text style={styles.actionModeCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputRow}>
        <Avatar
          uri={user?.profilePicture}
          fallback={user?.name?.charAt(0)}
          size={32}
        />
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={handleChangeText}
            placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
            placeholderTextColor={COLORS.textTertiary}
            multiline
            maxLength={500}
            style={styles.textInput}
          />
        </View>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!text.trim() || isSubmitting}
          style={[
            styles.sendButton,
            {
              backgroundColor: text.trim() && !isSubmitting ? COLORS.textLink : "#D1D5DB",
            },
          ]}
          activeOpacity={0.7}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="send"
              size={16}
              color={text.trim() ? "#FFFFFF" : "#9CA3AF"}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const COLORS = {
  bg: "#FFFFFF",
  cardBg: "#FFFFFF",
  cardShadow: "rgba(0, 0, 0, 0.06)",
  border: "#F0F0F0",
  borderLight: "#F7F7F8",
  textPrimary: "#1A1A1A",
  textSecondary: "#4A4A4A",
  textTertiary: "#8E8E93",
  textLink: "#007AFF",
  accent: "#FF3B5C",
  accentLight: "#FFF0F3",
  likeActive: "#FF3B5C",
  thumbActive: "#007AFF",
  inputBg: "#F5F5F7",
  inputBorder: "#E5E5EA",
  inputFocus: "#007AFF",
  replyBg: "#FAFAFA",
  replyBorder: "#F0F0F0",
  authorBadge: "#FF3B5C",
  authorBadgeBg: "#FFF0F3",
  editBg: "#FFF8E1",
  editBorder: "#FFE082",
  replyModeBg: "#F0FFF4",
  replyModeBorder: "#A7F3D0",
};

const Avatar = ({ uri, fallback, size = 36 }) => {
  if (uri) {
    return (
      <Image
        source={{ uri: `${getStaticImageBaseUrl()}${uri}` }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#E5E5EA",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#8E8E93", fontWeight: "700", fontSize: size * 0.38 }}>
        {fallback || "U"}
      </Text>
    </View>
  );
};

const CommentCard = ({
  item,
  onLongPress,
  onLike,
  onReply,
  onToggleReplies,
  isExpanded,
  postAuthorId,
  currentUser,
  renderReply,
}) => {
  const isOwnComment = item.author?._id === currentUser?._id;
  const commentAuthor = isOwnComment ? currentUser : item.author;
  const profilePicture = commentAuthor?.profilePicture;
  const isLiked = item.likes?.some((like) => like.user === currentUser?._id) || item.isLiked;
  const likeCount = item.likeCount || item.likes?.length || 0;
  const hasReplies = item.replies && item.replies.length > 0;
  const isPostAuthor = commentAuthor?._id === postAuthorId;
  const displayedReplies = isExpanded ? item.replies : (item.replies || []).slice(0, 2);

  const timeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    if (weeks < 4) return `${weeks}w`;
    return then.toLocaleDateString();
  };

  return (
    <View style={styles.commentCardContainer}>
      <View style={styles.commentCard}>
        <TouchableOpacity
          onLongPress={() => onLongPress(item)}
          delayLongPress={500}
          activeOpacity={0.8}
          style={styles.commentRow}
        >
          <Avatar
            uri={profilePicture}
            fallback={commentAuthor?.name?.charAt(0)}
            size={36}
          />
          <View style={styles.commentContent}>
            <View style={styles.commentBubble}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor} numberOfLines={1}>
                  {commentAuthor?.name || "Unknown User"}
                </Text>
                {isPostAuthor && (
                  <View style={styles.authorBadge}>
                    <Text style={styles.authorBadgeText}>Author</Text>
                  </View>
                )}
                <Text style={styles.commentTime}>
                  {timeAgo(item.createdAt)}
                </Text>
              </View>
              <Text style={styles.commentText} numberOfLines={10}>
                {item.content}
              </Text>
            </View>

            <View style={styles.commentActions}>
              <TouchableOpacity
                onPress={() => onLike(item._id)}
                style={styles.actionButton}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={14}
                  color={isLiked ? COLORS.likeActive : COLORS.textTertiary}
                />
                {likeCount > 0 && (
                  <Text
                    style={[
                      styles.actionText,
                      isLiked && styles.actionTextActive,
                    ]}
                  >
                    {likeCount}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onReply(item)}
                style={styles.actionButton}
                activeOpacity={0.6}
              >
                <Text style={styles.actionLink}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {hasReplies && (
        <View style={styles.repliesContainer}>
          <View style={styles.threadLine} />
          {displayedReplies.map((reply) => (
            <View key={reply._id} style={styles.replyWrapper}>
              {renderReply(reply, item._id)}
            </View>
          ))}
          {item.replies.length > 2 && (
            <TouchableOpacity
              onPress={() => onToggleReplies(item._id)}
              style={styles.viewRepliesButton}
              activeOpacity={0.6}
            >
              <View style={styles.viewRepliesLine} />
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color={COLORS.textLink}
              />
              <Text style={styles.viewRepliesText}>
                {isExpanded
                  ? `Hide replies`
                  : `View ${item.replies.length} replies`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const ReplyCard = ({
  item,
  onLongPress,
  onLike,
  onReply,
  currentUser,
  postAuthorId,
}) => {
  const isOwnReply = item.author?._id === currentUser?._id;
  const replyAuthor = isOwnReply ? currentUser : item.author;
  const profilePicture = replyAuthor?.profilePicture;
  const isLiked = item.likes?.some((like) => like.user === currentUser?._id) || item.isLiked;
  const likeCount = item.likeCount || item.likes?.length || 0;
  const isPostAuthor = replyAuthor?._id === postAuthorId;

  const timeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return then.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      onLongPress={() => onLongPress(item)}
      delayLongPress={500}
      activeOpacity={0.8}
      style={styles.replyRow}
    >
      <Avatar
        uri={profilePicture}
        fallback={replyAuthor?.name?.charAt(0)}
        size={28}
      />
      <View style={styles.replyContent}>
        <View style={styles.replyBubble}>
          <View style={styles.replyHeader}>
            <Text style={styles.replyAuthor} numberOfLines={1}>
              {replyAuthor?.name || "Unknown User"}
            </Text>
            {isPostAuthor && (
              <View style={styles.authorBadgeSmall}>
                <Text style={styles.authorBadgeTextSmall}>Author</Text>
              </View>
            )}
            <Text style={styles.replyTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.replyText} numberOfLines={6}>
            {item.content}
          </Text>
        </View>

        <View style={styles.replyActions}>
          <TouchableOpacity
            onPress={() => onLike(item._id)}
            style={styles.actionButtonSmall}
            activeOpacity={0.6}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={12}
              color={isLiked ? COLORS.likeActive : COLORS.textTertiary}
            />
            {likeCount > 0 && (
              <Text
                style={[
                  styles.actionTextSmall,
                  isLiked && styles.actionTextActive,
                ]}
              >
                {likeCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onReply(item)}
            style={styles.actionButtonSmall}
            activeOpacity={0.6}
          >
            <Text style={styles.actionLinkSmall}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [inputKey, setInputKey] = useState(0);
  const [initialInputText, setInitialInputText] = useState("");

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
    if (isVisible && postId) {
      bottomSheetRef.current?.expand();
      fetchComments();
    } else if (!isVisible) {
      bottomSheetRef.current?.close();
      setEditingComment(null);
      setSelectedComment(null);
      setShowActionMenu(false);
      setReplyingTo(null);
      setExpandedReplies({});
      setInitialInputText("");
      Keyboard.dismiss();
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

  const handleAddComment = useCallback(async (text) => {
    if (!text || !text.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingComment) {
        const response = await postsAPI.updateComment(editingComment._id, {
          content: text.trim(),
        });

        const updatedComment = response.data.data.comment;
        const isToxic = response.data.data.isToxic;
        const confidence = response.data.data.confidence;

        setComments((prev) =>
          prev.map((c) => (c._id === editingComment._id ? updatedComment : c))
        );
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
      } else if (replyingTo) {
        const response = await postsAPI.addComment(postId, {
          content: text.trim(),
          parentComment: replyingTo._id,
        });

        const newReplyData = response.data.data.comment;
        const isToxic = response.data.data.isToxic;
        const confidence = response.data.data.confidence;

        setComments((prev) =>
          prev.map((c) =>
            c._id === replyingTo._id
              ? { ...c, replies: [...(c.replies || []), newReplyData] }
              : c
          )
        );
        setReplyingTo(null);

        if (isToxic) {
          Alert.alert(
            "Toxic Content Detected",
            `Your reply contains inappropriate or offensive language (${(
              confidence * 100
            ).toFixed(1)}% confidence). The reply will be removed.`,
            [
              {
                text: "OK",
                onPress: async () => {
                  try {
                    await postsAPI.deleteComment(newReplyData._id);
                    setComments((prev) =>
                      prev.map((c) =>
                        c._id === replyingTo._id
                          ? { ...c, replies: c.replies.filter((r) => r._id !== newReplyData._id) }
                          : c
                      )
                    );
                  } catch (error) {
                    console.error("Error deleting toxic reply:", error);
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
      } else {
        const response = await postsAPI.addComment(postId, {
          content: text.trim(),
        });

        const newCommentData = response.data.data.comment;
        const isToxic = response.data.data.isToxic;
        const confidence = response.data.data.confidence;

        setComments((prev) => [newCommentData, ...prev]);

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
          editingComment ? "Failed to update comment" : replyingTo ? "Failed to add reply" : "Failed to add comment"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [editingComment, replyingTo, postId, onCommentAdded]);

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
    setInitialInputText(selectedComment.content);
    setEditingComment(selectedComment);
    setReplyingTo(null);
    setShowActionMenu(false);
    setInputKey((k) => k + 1);
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

  const handleCancelEdit = useCallback(() => {
    setInitialInputText("");
    setEditingComment(null);
  }, []);

  const handleCancelReply = useCallback(() => {
    setInitialInputText("");
    setReplyingTo(null);
  }, []);

  const handleLikeComment = async (commentId) => {
    try {
      const response = await postsAPI.likeComment(commentId);
      const { comment, liked, likeCount } = response.data.data;

      setComments((prev) =>
        prev.map((c) => {
          if (c._id === commentId) {
            return {
              ...c,
              likes: comment.likes,
              likeCount,
              isLiked: liked,
            };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r._id === commentId
                  ? { ...r, likes: comment.likes, likeCount, isLiked: liked }
                  : r
              ),
            };
          }
          return c;
        })
      );
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleReplyToComment = useCallback((comment) => {
    setInitialInputText(`@${comment.author?.name || "User"} `);
    setReplyingTo(comment);
    setEditingComment(null);
    setShowActionMenu(false);
    setInputKey((k) => k + 1);
  }, []);

  const handleToggleExpandReplies = useCallback((commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  }, []);

  const renderReply = useCallback(
    (item, parentId) => (
      <ReplyCard
        key={item._id}
        item={item}
        onLongPress={handleLongPress}
        onLike={handleLikeComment}
        onReply={handleReplyToComment}
        currentUser={user}
        postAuthorId={postAuthorId}
      />
    ),
    [user, handleLongPress, handleLikeComment, handleReplyToComment, postAuthorId]
  );

  const renderComment = useCallback(
    ({ item }) => (
      <CommentCard
        item={item}
        onLongPress={handleLongPress}
        onLike={handleLikeComment}
        onReply={handleReplyToComment}
        onToggleReplies={handleToggleExpandReplies}
        isExpanded={expandedReplies[item._id]}
        postAuthorId={postAuthorId}
        currentUser={user}
        renderReply={renderReply}
      />
    ),
    [user, handleLongPress, handleLikeComment, handleReplyToComment, handleToggleExpandReplies, expandedReplies, postAuthorId, renderReply]
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={56} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No comments yet</Text>
        <Text style={styles.emptySubtitle}>Be the first to share your thoughts</Text>
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

  const isActionMode = editingComment || replyingTo;

  const renderFooter = useCallback(
    (props) => (
      <BottomSheetFooter {...props}>
        <CommentInput
          key={inputKey}
          user={user}
          onSubmit={handleAddComment}
          isSubmitting={isSubmitting}
          initialText={initialInputText}
          replyingTo={replyingTo}
          editingComment={editingComment}
          onCancel={editingComment ? handleCancelEdit : handleCancelReply}
        />
      </BottomSheetFooter>
    ),
    [inputKey, user, handleAddComment, isSubmitting, initialInputText, replyingTo, editingComment, handleCancelEdit, handleCancelReply]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: COLORS.bg }}
      handleIndicatorStyle={{ backgroundColor: "#D1D5DB", width: 40 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      footerComponent={renderFooter}
    >
      <View style={{ flex: 1, width: windowWidth, backgroundColor: COLORS.bg }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.6}>
            <Ionicons name="close" size={24} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.textLink} />
          </View>
        ) : (
          <BottomSheetFlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
            style={{ flex: 1 }}
            removeClippedSubviews={false}
          />
        )}

        {/* Action Menu Modal */}
        <Modal
          visible={showActionMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowActionMenu(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowActionMenu(false)}
          >
            <View style={styles.actionMenu}>
              {selectedComment?.author?._id === user?._id && (
                <TouchableOpacity
                  onPress={handleEditComment}
                  style={styles.actionMenuItem}
                  activeOpacity={0.6}
                >
                  <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.actionMenuText}>Edit Comment</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleDeleteComment}
                style={styles.actionMenuItem}
                activeOpacity={0.6}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[styles.actionMenuText, { color: "#EF4444" }]}>Delete Comment</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: COLORS.textTertiary,
    fontSize: 14,
    marginTop: 4,
  },

  commentCardContainer: {
    marginTop: 8,
  },
  commentCard: {
    marginHorizontal: 12,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentBubble: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  commentTime: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginLeft: 6,
  },
  commentText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 4,
  },

  authorBadge: {
    backgroundColor: COLORS.authorBadgeBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  authorBadgeText: {
    color: COLORS.authorBadge,
    fontSize: 10,
    fontWeight: "700",
  },
  authorBadgeSmall: {
    backgroundColor: COLORS.authorBadgeBg,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 5,
  },
  authorBadgeTextSmall: {
    color: COLORS.authorBadge,
    fontSize: 9,
    fontWeight: "700",
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
  },
  actionText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  actionTextActive: {
    color: COLORS.likeActive,
  },
  actionLink: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: "600",
  },
  actionButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  actionTextSmall: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 3,
  },
  actionLinkSmall: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: "600",
  },

  repliesContainer: {
    marginTop: 2,
    marginBottom: 4,
  },
  threadLine: {
    position: "absolute",
    left: 28,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.border,
    borderRadius: 1,
  },
  replyWrapper: {
    marginLeft: 40,
  },
  viewRepliesButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 48,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  viewRepliesLine: {
    position: "absolute",
    left: -20,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.border,
    borderRadius: 1,
  },
  viewRepliesText: {
    color: COLORS.textLink,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },

  replyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingRight: 12,
  },
  replyContent: {
    flex: 1,
    marginLeft: 10,
  },
  replyBubble: {
    backgroundColor: COLORS.replyBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.replyBorder,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  replyAuthor: {
    fontWeight: "700",
    color: COLORS.textPrimary,
    fontSize: 13,
    flex: 1,
  },
  replyTime: {
    color: COLORS.textTertiary,
    fontSize: 11,
    marginLeft: 5,
  },
  replyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  replyActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginLeft: 2,
  },

  inputContainer: {
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  actionModeBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  actionModeText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  actionModeCancel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionModeCancelText: {
    color: COLORS.textLink,
    fontWeight: "700",
    fontSize: 13,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  textInput: {
    color: COLORS.textPrimary,
    fontSize: 14,
    maxHeight: 80,
    paddingVertical: Platform.OS === "ios" ? 4 : 0,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  actionMenu: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  actionMenuText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginLeft: 12,
  },
});

export default CommentsBottomSheet;
