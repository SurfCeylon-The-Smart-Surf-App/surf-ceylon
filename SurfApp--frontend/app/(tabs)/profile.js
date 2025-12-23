import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { userAPI, postsAPI, authAPI } from "../../services/api";
import { getStaticImageBaseUrl } from "../../utils/networkConfig";
import { useRealTimeUpdates } from "../../hooks/useRealTimeUpdates";
import { getUserSessions, getUserInsights } from "../../data/surfApi";

export default function ProfileScreen() {
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0,
  });

  // NEW: Modal states
  const [activeModal, setActiveModal] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [userPreferences, setUserPreferences] = useState({
    skillLevel: "Intermediate",
    minWaveHeight: 1,
    maxWaveHeight: 2,
    tidePreference: "Any",
    boardType: "Soft-top",
  });
  const [tempPreferences, setTempPreferences] = useState({});
  const [sessions, setSessions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [sessionFilter, setSessionFilter] = useState("newest");
  const [selectedSession, setSelectedSession] = useState(null);

  const { user, logout } = useAuth();
  const { getFollowerDelta, getFollowingDelta } = useRealTimeUpdates(user?._id);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
      // Load preferences and sessions
      loadUserData();
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchUserPosts();
        loadUserData();
      }
    }, [user])
  );

  const loadUserData = async () => {
    if (!user?._id) return;

    try {
      setIsLoading(true);

      // Fetch real user sessions and insights from backend
      const [sessionsResponse, insightsData] = await Promise.all([
        getUserSessions(user._id, 20),
        getUserInsights(user._id),
      ]);

      // Parse sessions
      if (sessionsResponse?.sessions) {
        const parsedSessions = sessionsResponse.sessions.map((session) => ({
          id: session._id,
          spotName: session.spotName,
          spotRegion: session.spotRegion,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : null,
          duration: session.duration || 0,
          rating: session.rating,
          wouldReturn: session.wouldReturn,
          comments: session.comments,
          waveHeight: session.conditions?.waveHeight,
          wavePeriod: session.conditions?.wavePeriod,
          windSpeed: session.conditions?.windSpeed,
          windDirection: session.conditions?.windDirection,
          tide: session.conditions?.tide,
          crowdLevel: session.conditions?.crowdLevel,
        }));
        setSessions(parsedSessions);
      }

      // Set insights
      if (insightsData) {
        setInsights({
          totalSessions: insightsData.totalSessions || 0,
          avgRating: insightsData.avgRating || 0,
          avgSessionDuration: insightsData.avgSessionDuration || 0,
          favoriteSpots: insightsData.favoriteSpots || [],
          bestTimesOfDay: insightsData.bestTimesOfDay || [],
          preferredConditions: insightsData.preferredConditions || {},
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      // Set empty data on error
      setSessions([]);
      setInsights({
        totalSessions: 0,
        avgRating: 0,
        avgSessionDuration: 0,
        favoriteSpots: [],
        bestTimesOfDay: [],
        preferredConditions: {},
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [postsResponse, userResponse] = await Promise.all([
        postsAPI.getUserPosts(user._id),
        userAPI.getProfile(),
      ]);

      const posts = postsResponse.data.data.posts || [];
      const freshUserData = userResponse.data.data.user;

      setUserPosts(posts);

      const totalLikes = posts.reduce(
        (sum, post) => sum + (post.likeCount || 0),
        0
      );

      setStats({
        posts: posts.length,
        followers: freshUserData.followers?.length || 0,
        following: freshUserData.following?.length || 0,
        likes: totalLikes,
      });
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserPosts().finally(() => setRefreshing(false));
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.name || !profileForm.email) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      await userAPI.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
      });
      Alert.alert("Success", "Profile updated successfully");
      setActiveModal(null);
      // Refresh user posts to get updated profile info
      await fetchUserPosts();
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update profile"
      );
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
    if (passwordForm.new.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });
      Alert.alert("Success", "Password changed successfully");
      setActiveModal(null);
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to change password"
      );
    }
  };

  const handleSavePreferences = async () => {
    try {
      const prefsToSave = {
        ...tempPreferences,
        minWaveHeight: parseFloat(tempPreferences.minWaveHeight),
        maxWaveHeight: parseFloat(tempPreferences.maxWaveHeight),
      };

      if (
        isNaN(prefsToSave.minWaveHeight) ||
        isNaN(prefsToSave.maxWaveHeight)
      ) {
        Alert.alert("Error", "Please enter valid numbers for wave height");
        return;
      }

      await authAPI.updatePreferences(prefsToSave);
      setUserPreferences(prefsToSave);
      setActiveModal(null);
      Alert.alert("Success", "Preferences updated successfully");
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save preferences"
      );
    }
  };

  const SessionCard = ({ session }) => (
    <TouchableOpacity
      onPress={() => setSelectedSession(session)}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-base font-bold text-gray-900">
          {session.spotName}
        </Text>
        <View className="bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-lg flex-row items-center">
          <Text className="text-xs font-bold text-yellow-800 mr-1">
            {session.rating}
          </Text>
          <Text>⭐</Text>
        </View>
      </View>

      <View className="flex-row justify-between mb-3">
        <Text className="text-xs text-gray-600">
          {new Date(session.startTime).toLocaleDateString()}
        </Text>
        <Text className="text-xs text-gray-600 font-medium">
          {session.duration} min
        </Text>
      </View>

      {session.comments && (
        <Text className="text-xs text-gray-600 italic mb-2">
          "{session.comments}"
        </Text>
      )}

      <View className="flex-row gap-3">
        <View className="bg-blue-50 rounded px-2 py-1 flex-row items-center">
          <Text className="mr-1">🌊</Text>
          <Text className="text-xs font-semibold text-blue-700">
            {session.waveHeight}m
          </Text>
        </View>
        <View className="bg-blue-50 rounded px-2 py-1 flex-row items-center">
          <Text className="mr-1">💨</Text>
          <Text className="text-xs font-semibold text-blue-700">
            {session.windSpeed}kph
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPostImage = ({ item }) => (
    <TouchableOpacity
      className="w-1/3 aspect-square bg-gray-200 mr-1 mb-1"
      onPress={() => router.push(`/postDetail?postId=${item._id}`)}
    >
      {item.images && item.images.length > 0 ? (
        <Image
          source={{ uri: `${getStaticImageBaseUrl()}${item.images[0].url}` }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-full bg-gray-300 items-center justify-center">
          <Ionicons name="text-outline" size={24} color="#9ca3af" />
          <Text className="text-xs text-gray-500 mt-1">Text</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView
          edges={["top"]}
          className="px-6 pb-4 flex-row items-center justify-between"
        >
          <Text className="text-white text-2xl font-bold">Profile</Text>
          <TouchableOpacity onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings" size={24} color="#ffffff" />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Info */}
        <View className="bg-white mx-4 mt-4 rounded-lg p-6 shadow-sm border border-gray-100">
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-gray-300 rounded-full items-center justify-center mb-4">
              {user?.profilePicture ? (
                <Image
                  source={{
                    uri: `${getStaticImageBaseUrl()}${user.profilePicture}`,
                  }}
                  className="w-24 h-24 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-gray-600 text-2xl font-bold">
                  {user?.name?.charAt(0) || "U"}
                </Text>
              )}
            </View>

            <View className="items-center">
              <View className="flex-row items-center mb-2">
                <Text className="text-2xl font-bold text-gray-900">
                  {user?.name || "User"}
                </Text>
                {user?.isVerified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#3b82f6"
                    className="ml-2"
                  />
                )}
              </View>

              {user?.username && (
                <Text className="text-gray-600 mb-2">@{user.username}</Text>
              )}

              {user?.bio && (
                <Text className="text-gray-600 text-base mt-2 text-center">
                  {user.bio}
                </Text>
              )}
              {user?.location && (
                <Text className="text-gray-500 text-sm mt-1 text-center">
                  📍 {user.location}
                </Text>
              )}
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row justify-around border-t border-b border-gray-100 py-4">
            <View className="items-center">
              <Text className="text-xl font-bold text-gray-900">
                {stats.posts}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Posts</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-gray-900">
                {stats.followers}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Followers</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-gray-900">
                {stats.following}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Following</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-gray-900">
                {stats.likes}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Likes</Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">
              Surfing Preferences
            </Text>
            <TouchableOpacity
              onPress={() => {
                setTempPreferences(userPreferences);
                setActiveModal("preferences");
              }}
            >
              <Text className="text-blue-600 font-semibold">Edit</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <View className="flex-row justify-between py-3 border-b border-gray-100">
              <Text className="text-gray-600">Skill Level</Text>
              <Text className="text-gray-900 font-semibold">
                {userPreferences.skillLevel}
              </Text>
            </View>
            <View className="flex-row justify-between py-3 border-b border-gray-100">
              <Text className="text-gray-600">Wave Height</Text>
              <Text className="text-gray-900 font-semibold">
                {userPreferences.minWaveHeight}m -{" "}
                {userPreferences.maxWaveHeight}m
              </Text>
            </View>
            <View className="flex-row justify-between py-3 border-b border-gray-100">
              <Text className="text-gray-600">Preferred Tide</Text>
              <Text className="text-gray-900 font-semibold">
                {userPreferences.tidePreference}
              </Text>
            </View>
            <View className="flex-row justify-between py-3">
              <Text className="text-gray-600">Board Type</Text>
              <Text className="text-gray-900 font-semibold">
                {userPreferences.boardType}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        {insights && (
          <View className="px-4 mt-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Your Stats
            </Text>
            <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <View className="flex-row justify-between py-3 border-b border-gray-100">
                <Text className="text-gray-600">Total Sessions</Text>
                <Text className="text-blue-600 font-bold">
                  {insights.totalSessions || 0}
                </Text>
              </View>
              <View className="flex-row justify-between py-3 border-b border-gray-100">
                <Text className="text-gray-600">Avg Rating</Text>
                <Text className="text-blue-600 font-bold">
                  {insights.avgRating ? `${insights.avgRating} ⭐` : "N/A"}
                </Text>
              </View>
              {insights.favoriteSpots && insights.favoriteSpots.length > 0 && (
                <View className="flex-row justify-between py-3 border-b border-gray-100">
                  <Text className="text-gray-600">Favorite Spot</Text>
                  <Text className="text-blue-600 font-bold">
                    {insights.favoriteSpots[0].spotName}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between py-3 border-b border-gray-100">
                <Text className="text-gray-600">Avg Duration</Text>
                <Text className="text-blue-600 font-bold">
                  {insights.avgSessionDuration
                    ? `${insights.avgSessionDuration} min`
                    : "N/A"}
                </Text>
              </View>
              {insights.bestTimesOfDay &&
                insights.bestTimesOfDay.length > 0 && (
                  <View className="flex-row justify-between py-3">
                    <Text className="text-gray-600">Best Time</Text>
                    <Text className="text-blue-600 font-bold">
                      {insights.bestTimesOfDay[0].timeRange}
                    </Text>
                  </View>
                )}
            </View>
          </View>
        )}

        {/* Recent Sessions */}
        <View className="px-4 mt-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">
              Recent Sessions
            </Text>
            {sessions.length > 0 && (
              <TouchableOpacity onPress={() => setActiveModal("sessions")}>
                <Text className="text-blue-600 font-semibold">View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {sessions.length > 0 ? (
            sessions
              .slice(0, 3)
              .map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
          ) : (
            <View className="bg-white rounded-lg p-6 items-center border border-gray-100">
              <Text className="text-3xl mb-2">🏄‍♂️</Text>
              <Text className="text-gray-600 text-sm">No sessions yet</Text>
            </View>
          )}
        </View>

        {/* Posts Section */}
        {userPosts.length > 0 && (
          <View className="px-4 pb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Posts</Text>
            <FlatList
              data={userPosts}
              renderItem={renderPostImage}
              keyExtractor={(item) => item._id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={{ marginHorizontal: -4 }}
            />
          </View>
        )}
      </ScrollView>

      {/* MODALS */}

      {/* Session Details Modal */}
      <Modal
        visible={selectedSession !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedSession(null)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">
              Session Details
            </Text>
            <TouchableOpacity onPress={() => setSelectedSession(null)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedSession && (
            <ScrollView className="p-4">
              <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                <DetailRow label="Spot" value={selectedSession.spotName} />
                <DetailRow
                  label="Date"
                  value={new Date(selectedSession.startTime).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                />
                <DetailRow
                  label="Duration"
                  value={`${selectedSession.duration} minutes`}
                />
                <DetailRow
                  label="Rating"
                  value={`${selectedSession.rating} ⭐`}
                />
                <DetailRow
                  label="Wave Height"
                  value={`${selectedSession.waveHeight}m`}
                />
                <DetailRow
                  label="Wind Speed"
                  value={`${selectedSession.windSpeed} kph`}
                />
                {selectedSession.comments && (
                  <View className="py-3 border-t border-gray-100 mt-3">
                    <Text className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                      Comments
                    </Text>
                    <Text className="text-gray-900">
                      {selectedSession.comments}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Settings Menu Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSettingsVisible(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-t-3xl"
          >
            <View className="p-4 border-b border-gray-200">
              <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-2" />
              <Text className="text-lg font-bold text-gray-900 text-center">
                Settings
              </Text>
            </View>

            <View className="px-4 pb-6">
              <TouchableOpacity
                onPress={() => {
                  setSettingsVisible(false);
                  setProfileForm({
                    name: user?.name || "",
                    email: user?.email || "",
                  });
                  setActiveModal("profile");
                }}
                className="flex-row items-center py-4 border-b border-gray-100"
              >
                <Ionicons name="person-outline" size={24} color="#6b7280" />
                <Text className="text-gray-900 text-base font-medium ml-3">
                  Edit Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSettingsVisible(false);
                  setActiveModal("password");
                }}
                className="flex-row items-center py-4 border-b border-gray-100"
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color="#6b7280"
                />
                <Text className="text-gray-900 text-base font-medium ml-3">
                  Change Password
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSettingsVisible(false);
                  handleLogout();
                }}
                className="flex-row items-center py-4"
              >
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                <Text className="text-red-500 text-base font-medium ml-3">
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={activeModal === "profile"}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-900">
                Edit Profile
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2 mt-4">
                Name
              </Text>
              <TextInput
                value={profileForm.name}
                onChangeText={(text) =>
                  setProfileForm((prev) => ({ ...prev, name: text }))
                }
                placeholder="Enter your name"
                className="bg-white border border-gray-200 rounded-lg p-3 mb-4 text-gray-900"
                placeholderTextColor="#9ca3af"
              />

              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Email
              </Text>
              <TextInput
                value={profileForm.email}
                onChangeText={(text) =>
                  setProfileForm((prev) => ({ ...prev, email: text }))
                }
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-white border border-gray-200 rounded-lg p-3 mb-6 text-gray-900"
                placeholderTextColor="#9ca3af"
              />

              <TouchableOpacity
                onPress={handleUpdateProfile}
                className="bg-blue-600 py-3 rounded-lg items-center"
              >
                <Text className="text-white text-base font-semibold">
                  Save Changes
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={activeModal === "password"}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-900">
                Change Password
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2 mt-4">
                Current Password
              </Text>
              <TextInput
                value={passwordForm.current}
                onChangeText={(text) =>
                  setPasswordForm((prev) => ({ ...prev, current: text }))
                }
                placeholder="Enter current password"
                secureTextEntry
                className="bg-white border border-gray-200 rounded-lg p-3 mb-4 text-gray-900"
                placeholderTextColor="#9ca3af"
              />

              <Text className="text-sm font-semibold text-gray-700 mb-2">
                New Password
              </Text>
              <TextInput
                value={passwordForm.new}
                onChangeText={(text) =>
                  setPasswordForm((prev) => ({ ...prev, new: text }))
                }
                placeholder="Enter new password"
                secureTextEntry
                className="bg-white border border-gray-200 rounded-lg p-3 mb-4 text-gray-900"
                placeholderTextColor="#9ca3af"
              />

              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </Text>
              <TextInput
                value={passwordForm.confirm}
                onChangeText={(text) =>
                  setPasswordForm((prev) => ({ ...prev, confirm: text }))
                }
                placeholder="Confirm new password"
                secureTextEntry
                className="bg-white border border-gray-200 rounded-lg p-3 mb-6 text-gray-900"
                placeholderTextColor="#9ca3af"
              />

              <TouchableOpacity
                onPress={handleChangePassword}
                className="bg-blue-600 py-3 rounded-lg items-center"
              >
                <Text className="text-white text-base font-semibold">
                  Update Password
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Preferences Modal */}
      <Modal
        visible={activeModal === "preferences"}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-900">
                Edit Preferences
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-4">
              <Text className="text-sm font-semibold text-gray-700 mb-3 mt-4">
                Skill Level
              </Text>
              <View className="flex-row gap-2 mb-6">
                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() =>
                      setTempPreferences((prev) => ({
                        ...prev,
                        skillLevel: level,
                      }))
                    }
                    className={`flex-1 py-2 px-3 rounded-lg items-center border ${
                      tempPreferences.skillLevel === level
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        tempPreferences.skillLevel === level
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Wave Height (m)
              </Text>
              <View className="flex-row gap-3 mb-6">
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 mb-1">Min</Text>
                  <TextInput
                    value={String(tempPreferences.minWaveHeight)}
                    onChangeText={(text) =>
                      setTempPreferences((prev) => ({
                        ...prev,
                        minWaveHeight: text,
                      }))
                    }
                    keyboardType="decimal-pad"
                    className="bg-white border border-gray-200 rounded-lg p-3 text-gray-900"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 mb-1">Max</Text>
                  <TextInput
                    value={String(tempPreferences.maxWaveHeight)}
                    onChangeText={(text) =>
                      setTempPreferences((prev) => ({
                        ...prev,
                        maxWaveHeight: text,
                      }))
                    }
                    keyboardType="decimal-pad"
                    className="bg-white border border-gray-200 rounded-lg p-3 text-gray-900"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Preferred Tide
              </Text>
              <View className="flex-row gap-2 mb-6">
                {["Any", "High", "Mid", "Low"].map((tide) => (
                  <TouchableOpacity
                    key={tide}
                    onPress={() =>
                      setTempPreferences((prev) => ({
                        ...prev,
                        tidePreference: tide,
                      }))
                    }
                    className={`flex-1 py-2 px-2 rounded-lg items-center border ${
                      tempPreferences.tidePreference === tide
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-semibold text-xs ${
                        tempPreferences.tidePreference === tide
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {tide}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Board Type
              </Text>
              <View className="flex-row gap-2 mb-6">
                {["Shortboard", "Longboard", "Soft-top"].map((board) => (
                  <TouchableOpacity
                    key={board}
                    onPress={() =>
                      setTempPreferences((prev) => ({
                        ...prev,
                        boardType: board,
                      }))
                    }
                    className={`flex-1 py-2 px-2 rounded-lg items-center border ${
                      tempPreferences.boardType === board
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-semibold text-xs ${
                        tempPreferences.boardType === board
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {board}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSavePreferences}
                className="bg-blue-600 py-3 rounded-lg items-center"
              >
                <Text className="text-white text-base font-semibold">
                  Save Preferences
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* All Sessions Modal */}
      <Modal
        visible={activeModal === "sessions"}
        animationType="slide"
        transparent={true}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">
              All Sessions
            </Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row gap-2">
            {["newest", "oldest", "highest_rated"].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setSessionFilter(filter)}
                className={`px-4 py-2 rounded-full border ${
                  sessionFilter === filter
                    ? "bg-blue-600 border-blue-600"
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    sessionFilter === filter ? "text-white" : "text-gray-700"
                  }`}
                >
                  {filter === "newest"
                    ? "Newest"
                    : filter === "oldest"
                    ? "Oldest"
                    : "Highest Rated"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SessionCard session={item} />}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-gray-600">No sessions found</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// Helper component
function DetailRow({ label, value }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className="text-sm font-semibold text-gray-900">{value}</Text>
    </View>
  );
}
