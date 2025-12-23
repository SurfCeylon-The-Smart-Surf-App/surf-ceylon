import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import { getStaticImageBaseUrl } from "../../utils/networkConfig";
import * as MediaLibrary from "expo-media-library";
import { useAuth } from "../../hooks/useAuth";
import { postsAPI, userAPI } from "../../services/api";
import { router, useFocusEffect } from "expo-router";
import CommentsBottomSheet from "../../components/CommentsBottomSheet";

export default function CommunityScreen() {
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostCommentCount, setSelectedPostCommentCount] = useState(0);
  const [selectedPostAuthorId, setSelectedPostAuthorId] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [modalPostContent, setModalPostContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showPostActionMenu, setShowPostActionMenu] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editPostContent, setEditPostContent] = useState("");

  const { user } = useAuth();

  // Debounced search function
  const debouncedSearch = (query) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    // Set new timeout for search
    const newTimeout = setTimeout(async () => {
      try {
        const response = await userAPI.searchUsers(query.trim());
        setSearchResults(response.data.data.users || []);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // 300ms delay

    setSearchTimeout(newTimeout);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Refresh posts when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Silently refresh posts in the background
      fetchPosts(1, true);
    }, [user]) // Add user as dependency to refresh when user data changes
  );

  const fetchPosts = async (pageNum = 1, refresh = false) => {
    if (pageNum === 1 && !refresh) setIsLoading(true);

    try {
      const response = await postsAPI.getFeed({ page: pageNum, limit: 10 });
      const newPosts = response.data.data.posts;

      if (refresh || pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching posts:", error);
      const errorMessage =
        error.code === "NETWORK_ERROR"
          ? "Network connection failed. Please check if the server is running."
          : "Failed to load posts. Please try again.";
      Alert.alert("Connection Error", errorMessage);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      Alert.alert("Error", "Please enter some content");
      return;
    }

    try {
      const response = await postsAPI.createPost({ content: postContent });
      const newPost = response.data.data.post;

      setPosts((prev) => [newPost, ...prev]);
      setPostContent("");
      setShowCreatePost(false);
      Alert.alert("Success", "Post created successfully");
    } catch (error) {
      // Check if it's a toxicity error
      if (error.response?.data?.isToxic) {
        const confidence = error.response.data.confidence;
        Alert.alert(
          "⚠️ Toxic Content Detected",
          `Your post contains inappropriate or offensive language (${(
            confidence * 100
          ).toFixed(
            1
          )}% confidence). Please revise your message before posting.`,
          [{ text: "OK", style: "default" }]
        );
      } else {
        console.error("Error creating post:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to create post";
        Alert.alert("Error", errorMessage);
      }
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await userAPI.searchUsers(query.trim());
      setSearchResults(response.data.data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    handleSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const handleCreatePostWithMedia = async () => {
    if (!modalPostContent.trim() && selectedMedia.length === 0) {
      Alert.alert("Error", "Please enter some content or attach media");
      return;
    }

    try {
      let response;
      if (selectedMedia.length > 0) {
        // Create FormData for media upload
        const formData = new FormData();

        // Only append content if it's not empty
        if (modalPostContent.trim()) {
          formData.append("content", modalPostContent.trim());
        }

        selectedMedia.forEach((media, index) => {
          const uriParts = media.uri.split(".");
          const fileType = uriParts[uriParts.length - 1];

          formData.append("images", {
            uri: media.uri,
            name: `image_${Date.now()}_${index}.${fileType}`,
            type: `image/${fileType}`,
          });
        });

        response = await postsAPI.createPostWithMedia(formData);
      } else {
        // Create text-only post
        response = await postsAPI.createPost({
          content: modalPostContent.trim(),
        });
      }

      const newPost = response.data.data.post;

      setPosts((prev) => [newPost, ...prev]);
      setModalPostContent("");
      setSelectedMedia([]);
      setShowCreatePostModal(false);
      Alert.alert("Success", "Post created successfully");
    } catch (error) {
      // Check if it's a toxicity error
      if (error.response?.data?.isToxic) {
        const confidence = error.response.data.confidence;
        Alert.alert(
          "⚠️ Toxic Content Detected",
          `Your post contains inappropriate or offensive language (${(
            confidence * 100
          ).toFixed(
            1
          )}% confidence). Please revise your message before posting.`,
          [{ text: "OK", style: "default" }]
        );
      } else {
        console.error("Error creating post:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to create post";
        Alert.alert("Error", errorMessage);
      }
    }
  };

  const pickMedia = () => {
    Alert.alert("Select Media", "Choose an option", [
      { text: "Camera", onPress: () => openCamera() },
      { text: "Photo Library", onPress: () => openImagePicker() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera permission is required to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedMedia((prev) => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to open camera");
    }
  };

  const openImagePicker = async () => {
    try {
      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Photo library permission is required to select photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        setSelectedMedia((prev) => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to open photo library");
    }
  };

  const removeMedia = (index) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await postsAPI.likePost(postId);
      const updatedPost = response.data.data.post;

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: updatedPost.likes,
                likeCount: updatedPost.likeCount,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
      Alert.alert("Error", "Failed to like post");
    }
  };

  const handleOpenComments = (postId, commentCount, postAuthorId) => {
    setSelectedPostId(postId);
    setSelectedPostCommentCount(commentCount);
    setSelectedPostAuthorId(postAuthorId);
    setCommentsVisible(true);
  };

  const handleCloseComments = () => {
    setCommentsVisible(false);
    setSelectedPostId(null);
    setSelectedPostCommentCount(0);
    setSelectedPostAuthorId(null);
  };

  const handleCommentAdded = (increment = true) => {
    // Update the comment count locally for the selected post
    setPosts((prev) =>
      prev.map((post) =>
        post._id === selectedPostId
          ? {
              ...post,
              commentCount: increment
                ? (post.commentCount || 0) + 1
                : Math.max((post.commentCount || 0) - 1, 0),
            }
          : post
      )
    );

    // Update the selected post comment count
    setSelectedPostCommentCount((prev) =>
      increment ? prev + 1 : Math.max(prev - 1, 0)
    );
  };

  const handleCommentCountSync = (actualCount) => {
    // Sync the actual comment count from server
    setPosts((prev) =>
      prev.map((post) =>
        post._id === selectedPostId
          ? { ...post, commentCount: actualCount }
          : post
      )
    );
    setSelectedPostCommentCount(actualCount);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(1, true);
  };

  const handlePostMenu = (post) => {
    // Only show menu for own posts
    if (post.author?._id === user?._id) {
      setSelectedPost(post);
      setShowPostActionMenu(true);
    }
  };

  const handleEditPost = () => {
    setEditPostContent(selectedPost.content);
    setEditingPost(selectedPost);
    setShowPostActionMenu(false);
    setShowEditPostModal(true);
  };

  const handleUpdatePost = async () => {
    if (!editPostContent.trim()) {
      Alert.alert("Error", "Post content cannot be empty");
      return;
    }

    try {
      const response = await postsAPI.updatePost(editingPost._id, {
        content: editPostContent.trim(),
      });
      const updatedPost = response.data.data.post;
      const isToxic = response.data.data.isToxic;
      const confidence = response.data.data.confidence;

      setPosts((prev) =>
        prev.map((post) =>
          post._id === editingPost._id
            ? { ...post, content: updatedPost.content }
            : post
        )
      );

      setEditPostContent("");
      setEditingPost(null);
      setShowEditPostModal(false);

      // Show toxicity warning if detected
      if (isToxic) {
        Alert.alert(
          "⚠️ Toxic Content Detected",
          `Your post may contain inappropriate or offensive language (${(
            confidence * 100
          ).toFixed(
            1
          )}% confidence). Please be respectful in your interactions.`,
          [{ text: "OK", style: "default" }]
        );
      } else {
        Alert.alert("Success", "Post updated successfully");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      Alert.alert("Error", "Failed to update post");
    }
  };

  const handleDeletePost = async () => {
    setShowPostActionMenu(false);
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await postsAPI.deletePost(selectedPost._id);
            setPosts((prev) =>
              prev.filter((post) => post._id !== selectedPost._id)
            );
            Alert.alert("Success", "Post deleted successfully");
          } catch (error) {
            console.error("Error deleting post:", error);
            Alert.alert("Error", "Failed to delete post");
          }
        },
      },
    ]);
  };

  const renderPost = ({ item }) => {
    // Use current user data if this post is from the logged-in user
    const isOwnPost = item.author?._id === user?._id;
    const authorData = isOwnPost ? user : item.author;
    const profilePicture = authorData?.profilePicture;

    return (
      <View className="bg-white rounded-lg mx-4 mb-4 shadow-sm border border-gray-100">
        {/* Post Header */}
        <View className="flex-row items-center p-4 pb-3">
          {profilePicture ? (
            <Image
              source={{ uri: `${getStaticImageBaseUrl()}${profilePicture}` }}
              className="w-12 h-12 rounded-full mr-3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 bg-gray-300 rounded-full mr-3 items-center justify-center">
              <Text className="text-gray-600 font-semibold">
                {authorData?.name?.charAt(0) || "U"}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="font-semibold text-gray-900 mr-2">
                {authorData?.name || "Unknown User"}
              </Text>
              {authorData?.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
              )}
            </View>
            <Text className="text-gray-500 text-sm">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {isOwnPost && (
            <TouchableOpacity onPress={() => handlePostMenu(item)}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Post Content */}
        <View className="px-4 pb-3">
          <Text className="text-gray-900 leading-5">{item.content}</Text>

          {/* Hashtags */}
          {item.hashtags && item.hashtags.length > 0 && (
            <Text className="text-blue-600 mt-2">
              {item.hashtags.map((tag) => `#${tag}`).join(" ")}
            </Text>
          )}
        </View>

        {/* Post Image (if exists) */}
        {item.images && item.images.length > 0 && (
          <View>
            {item.images.length === 1 ? (
              <Image
                source={{
                  uri: `${getStaticImageBaseUrl()}${item.images[0].url}`,
                }}
                className="w-full h-64 bg-gray-200"
                resizeMode="cover"
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {item.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: `${getStaticImageBaseUrl()}${image.url}` }}
                    className="w-64 h-64 bg-gray-200 mr-2"
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Post Stats */}
        <View className="flex-row items-center px-4 py-2 border-t border-gray-100">
          <Text className="text-gray-600 text-sm flex-1">
            {item.likeCount || 0} likes
          </Text>
          <Text className="text-gray-600 text-sm">
            {item.commentCount || 0} comments
          </Text>
          <Text className="text-gray-600 text-sm ml-4">
            {item.shareCount || 0} shares
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
          <TouchableOpacity
            onPress={() => handleLikePost(item._id)}
            className="flex-row items-center flex-1 justify-center py-1"
          >
            <Ionicons
              name={
                item.likes?.some((like) => like.user === user?._id)
                  ? "heart"
                  : "heart-outline"
              }
              size={20}
              color={
                item.likes?.some((like) => like.user === user?._id)
                  ? "#ef4444"
                  : "#6b7280"
              }
            />
            <Text
              className={`ml-2 font-medium ${
                item.likes?.some((like) => like.user === user?._id)
                  ? "text-red-500"
                  : "text-gray-600"
              }`}
            >
              Like
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              handleOpenComments(item._id, item.commentCount, item.author._id)
            }
            className="flex-row items-center flex-1 justify-center py-1"
          >
            <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
            <Text className="text-gray-600 ml-2 font-medium">Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center flex-1 justify-center py-1">
            <Ionicons name="share-outline" size={20} color="#6b7280" />
            <Text className="text-gray-600 ml-2 font-medium">Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1">
        <StatusBar barStyle="light-content" />
        {/* Header with gradient extending to notch */}
        <LinearGradient
          colors={["#2563eb", "#1d4ed8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <SafeAreaView
            edges={["top"]}
            className="px-6 pb-4 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-white text-2xl font-bold">Community</Text>
              <Text className="text-blue-100 text-sm">
                Connect with fellow surfers
              </Text>
            </View>
            <View className="flex-row space-x-3">
              <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
                <Ionicons name="search" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/messenger")}>
                <Ionicons name="chatbubbles" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Search Bar */}
        {showSearch && (
          <View className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-3">
              <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Ionicons name="search" size={20} color="#6b7280" />
                <TextInput
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    debouncedSearch(text);
                  }}
                  placeholder="Search users..."
                  className="flex-1 ml-2 text-gray-900"
                  autoFocus
                />
              </View>
              <TouchableOpacity onPress={clearSearch} className="ml-3 p-2">
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {searchLoading && (
              <View className="py-4">
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            )}

            {searchResults.length > 0 && (
              <ScrollView className="max-h-60">
                {searchResults.map((searchUser) => (
                  <TouchableOpacity
                    key={searchUser._id}
                    onPress={() => {
                      router.push(`/userProfile?userId=${searchUser._id}`);
                      clearSearch();
                    }}
                    className="flex-row items-center py-3 border-b border-gray-100"
                  >
                    <View className="w-10 h-10 bg-gray-300 rounded-full mr-3 items-center justify-center">
                      {searchUser.profilePicture ? (
                        <Image
                          source={{
                            uri: `${getStaticImageBaseUrl()}${
                              searchUser.profilePicture
                            }`,
                          }}
                          className="w-10 h-10 rounded-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Text className="text-gray-600 font-semibold">
                          {searchUser.name?.charAt(0) || "U"}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        {searchUser.name}
                      </Text>
                      {searchUser.username && (
                        <Text className="text-gray-500 text-sm">
                          @{searchUser.username}
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {searchQuery.trim() &&
              !searchLoading &&
              searchResults.length === 0 && (
                <View className="py-4">
                  <Text className="text-gray-500 text-center">
                    No users found
                  </Text>
                </View>
              )}
          </View>
        )}

        <View className="flex-1 bg-gray-50">
          {/* Add missing ActivityIndicator import */}
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={
              showCreatePost ? (
                /* Create Post */
                <View className="bg-white mx-4 mt-4 mb-4 rounded-lg p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-start">
                    {user?.profilePicture ? (
                      <Image
                        source={{
                          uri: `${getStaticImageBaseUrl()}${
                            user.profilePicture
                          }`,
                        }}
                        className="w-10 h-10 rounded-full mr-3"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-10 h-10 bg-gray-300 rounded-full mr-3 items-center justify-center">
                        <Text className="text-gray-600 font-semibold">
                          {user?.name?.charAt(0) || "U"}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <TextInput
                        value={postContent}
                        onChangeText={setPostContent}
                        placeholder="What's on your mind?"
                        className="bg-gray-100 rounded-lg px-4 py-3 text-gray-900 min-h-[80px]"
                        multiline
                        textAlignVertical="top"
                        placeholderTextColor="#9ca3af"
                      />
                      <View className="flex-row justify-end mt-3 space-x-2">
                        <TouchableOpacity
                          onPress={() => {
                            setShowCreatePost(false);
                            setPostContent("");
                          }}
                          className="bg-gray-500 rounded-lg py-2 px-4"
                        >
                          <Text className="text-white font-medium">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleCreatePost}
                          className="bg-blue-600 rounded-lg py-2 px-4"
                        >
                          <Text className="text-white font-medium">Post</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Comments Bottom Sheet */}
        <CommentsBottomSheet
          isVisible={commentsVisible}
          onClose={handleCloseComments}
          postId={selectedPostId}
          postAuthorId={selectedPostAuthorId}
          commentCount={selectedPostCommentCount}
          onCommentAdded={handleCommentAdded}
          onCommentCountSync={handleCommentCountSync}
        />

        {/* Floating Action Button */}
        {!commentsVisible && (
          <TouchableOpacity
            onPress={() => setShowCreatePostModal(true)}
            className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg elevation-8"
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
            }}
          >
            <Ionicons name="add" size={28} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* Facebook-style Create Post Modal */}
        <Modal
          visible={showCreatePostModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View className="flex-1 bg-white">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
              <TouchableOpacity onPress={() => setShowCreatePostModal(false)}>
                <Text className="text-gray-600 text-lg">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">
                Create Post
              </Text>
              <TouchableOpacity
                onPress={handleCreatePostWithMedia}
                className={`px-4 py-2 rounded-lg ${
                  modalPostContent.trim() || selectedMedia.length > 0
                    ? "bg-blue-600"
                    : "bg-gray-300"
                }`}
                disabled={
                  !modalPostContent.trim() && selectedMedia.length === 0
                }
              >
                <Text
                  className={`font-medium ${
                    modalPostContent.trim() || selectedMedia.length > 0
                      ? "text-white"
                      : "text-gray-500"
                  }`}
                >
                  Post
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4">
              {/* User Info */}
              <View className="flex-row items-center py-4">
                {user?.profilePicture ? (
                  <Image
                    source={{
                      uri: `${getStaticImageBaseUrl()}${user.profilePicture}`,
                    }}
                    className="w-12 h-12 rounded-full mr-3"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-12 h-12 bg-gray-300 rounded-full mr-3 items-center justify-center">
                    <Text className="text-gray-600 font-semibold">
                      {user?.name?.charAt(0) || "U"}
                    </Text>
                  </View>
                )}
                <View>
                  <Text className="font-semibold text-gray-900">
                    {user?.name || "Unknown User"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="globe-outline" size={16} color="#6b7280" />
                    <Text className="text-gray-500 text-sm ml-1">Public</Text>
                  </View>
                </View>
              </View>

              {/* Text Input */}
              <TextInput
                value={modalPostContent}
                onChangeText={setModalPostContent}
                placeholder="What's on your mind?"
                className="text-gray-900 text-lg min-h-[120px] mb-4"
                multiline
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
                style={{ fontSize: 18 }}
              />

              {/* Media Preview */}
              {selectedMedia.length > 0 && (
                <View className="mb-4">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedMedia.map((media, index) => (
                      <View key={index} className="mr-3 relative">
                        <Image
                          source={{ uri: media.uri }}
                          className="w-32 h-32 rounded-lg"
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          onPress={() => removeMedia(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 rounded-full items-center justify-center"
                        >
                          <Ionicons name="close" size={16} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Add to Post Options */}
              <View className="border border-gray-200 rounded-lg p-4 mb-4">
                <Text className="text-gray-900 font-medium mb-3">
                  Add to your post
                </Text>
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={pickMedia}
                    className="flex-row items-center flex-1 justify-center py-3 bg-gray-50 rounded-lg mr-2"
                  >
                    <Ionicons name="image" size={24} color="#22c55e" />
                    <Text className="text-gray-700 ml-2 font-medium">
                      Photo/Video
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row items-center flex-1 justify-center py-3 bg-gray-50 rounded-lg ml-2">
                    <Ionicons name="location" size={24} color="#ef4444" />
                    <Text className="text-gray-700 ml-2 font-medium">
                      Location
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between mt-3">
                  <TouchableOpacity className="flex-row items-center flex-1 justify-center py-3 bg-gray-50 rounded-lg mr-2">
                    <Ionicons name="happy" size={24} color="#f59e0b" />
                    <Text className="text-gray-700 ml-2 font-medium">
                      Feeling
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row items-center flex-1 justify-center py-3 bg-gray-50 rounded-lg ml-2">
                    <Ionicons name="people" size={24} color="#3b82f6" />
                    <Text className="text-gray-700 ml-2 font-medium">
                      Tag People
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Post Action Menu Modal */}
        <Modal
          visible={showPostActionMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPostActionMenu(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-center items-center"
            activeOpacity={1}
            onPress={() => setShowPostActionMenu(false)}
          >
            <View className="bg-white rounded-2xl mx-8 w-64 overflow-hidden">
              <TouchableOpacity
                className="flex-row items-center px-4 py-4 border-b border-gray-200"
                onPress={handleEditPost}
              >
                <Ionicons name="create-outline" size={24} color="#3b82f6" />
                <Text className="ml-3 text-gray-900 text-base font-medium">
                  Edit Post
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center px-4 py-4"
                onPress={handleDeletePost}
              >
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
                <Text className="ml-3 text-red-600 text-base font-medium">
                  Delete Post
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Edit Post Modal */}
        <Modal
          visible={showEditPostModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View className="flex-1 bg-white">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
              <TouchableOpacity
                onPress={() => {
                  setShowEditPostModal(false);
                  setEditPostContent("");
                  setEditingPost(null);
                }}
              >
                <Text className="text-gray-600 text-lg">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">
                Edit Post
              </Text>
              <TouchableOpacity
                onPress={handleUpdatePost}
                className={`px-4 py-2 rounded-lg ${
                  editPostContent.trim() ? "bg-blue-600" : "bg-gray-300"
                }`}
                disabled={!editPostContent.trim()}
              >
                <Text
                  className={`font-medium ${
                    editPostContent.trim() ? "text-white" : "text-gray-500"
                  }`}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4">
              {/* User Info */}
              <View className="flex-row items-center py-4">
                {user?.profilePicture ? (
                  <Image
                    source={{
                      uri: `${getStaticImageBaseUrl()}${user.profilePicture}`,
                    }}
                    className="w-12 h-12 rounded-full mr-3"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-12 h-12 bg-gray-300 rounded-full mr-3 items-center justify-center">
                    <Text className="text-gray-600 font-semibold">
                      {user?.name?.charAt(0) || "U"}
                    </Text>
                  </View>
                )}
                <View>
                  <Text className="font-semibold text-gray-900">
                    {user?.name || "Unknown User"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="globe-outline" size={16} color="#6b7280" />
                    <Text className="text-gray-500 text-sm ml-1">Public</Text>
                  </View>
                </View>
              </View>

              {/* Text Input */}
              <TextInput
                value={editPostContent}
                onChangeText={setEditPostContent}
                placeholder="What's on your mind?"
                className="text-gray-900 text-lg min-h-[120px] mb-4"
                multiline
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
                style={{ fontSize: 18 }}
                autoFocus
              />
            </ScrollView>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}
