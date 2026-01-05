import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { getStaticApiBaseUrl } from "../utils/networkConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "../global.css";

export default function AIVideoAnalyzer() {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Request media library permissions
  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to select videos."
        );
        return false;
      }
    }
    return true;
  };

  // Pick video from gallery
  const pickVideo = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];

        // Check file size (max 50MB)
        if (video.fileSize && video.fileSize > 50 * 1024 * 1024) {
          Alert.alert(
            "File Too Large",
            "Please select a video smaller than 50MB."
          );
          return;
        }

        setSelectedVideo(video);
        setAnalysisResult(null);
        console.log("Selected video:", video.uri);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "Failed to pick video. Please try again.");
    }
  };

  // Analyze video
  const analyzeVideo = async () => {
    if (!selectedVideo) {
      Alert.alert("No Video", "Please select a video first.");
      return;
    }

    try {
      setAnalyzing(true);
      setUploadProgress(0);

      // Get auth token
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Please login to use this feature.");
        return;
      }

      // Prepare form data
      const formData = new FormData();

      // Handle different platforms
      const videoFile = {
        uri: selectedVideo.uri,
        type: "video/mp4",
        name: selectedVideo.fileName || `surf-video-${Date.now()}.mp4`,
      };

      formData.append("video", videoFile);

      const API_URL = getStaticApiBaseUrl();

      // Upload and analyze (with extended timeout for video processing)
      const response = await axios.post(
        `${API_URL}/video-analysis/analyze`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 120000, // 2 minutes timeout for video analysis
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      if (response.data.success) {
        setAnalysisResult(response.data.data);
        Alert.alert("Analysis Complete", "Your video has been analyzed!");
      } else {
        throw new Error(response.data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to analyze video. Please try again.";
      Alert.alert("Analysis Failed", errorMessage);
    } finally {
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  // Get rating badge style
  const getRatingStyle = (rating) => {
    switch (rating) {
      case "excellent":
        return "bg-green-50 border-green-200 text-green-800";
      case "good":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "needs_improvement":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "learning":
        return "bg-purple-50 border-purple-200 text-purple-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  // Get rating icon
  const getRatingIcon = (rating) => {
    switch (rating) {
      case "excellent":
        return "trophy";
      case "good":
        return "thumbs-up";
      case "needs_improvement":
        return "warning";
      case "learning":
        return "school";
      default:
        return "information-circle";
    }
  };

  // Get rating color
  const getRatingColor = (rating) => {
    switch (rating) {
      case "excellent":
        return "#10b981";
      case "good":
        return "#3b82f6";
      case "needs_improvement":
        return "#f59e0b";
      case "learning":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  // Render feedback section
  const renderFeedback = () => {
    if (!analysisResult || !analysisResult.success) return null;

    const { classification, feedback } = analysisResult;
    const ratingStyle = getRatingStyle(feedback.rating);
    const ratingColor = getRatingColor(feedback.rating);
    const ratingIcon = getRatingIcon(feedback.rating);

    return (
      <View className="mb-5">
        {/* Classification Card */}
        <View className="bg-white rounded-xl p-5 mb-3 shadow-sm border border-gray-100">
          <Text className="text-base font-semibold text-gray-500 mb-3">
            Detected Technique
          </Text>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-2xl font-bold text-gray-900 capitalize">
              {classification.pose}
            </Text>
            <View className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
              <Text className="text-xs font-bold text-blue-700">
                {(classification.confidence * 100).toFixed(0)}% confident
              </Text>
            </View>
          </View>
          <Text className="text-xs text-gray-400">
            Analyzed {classification.frames_analyzed} frames
          </Text>
        </View>

        {/* Feedback Card */}
        <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4">
            <View
              className={`${ratingStyle} border px-3 py-1.5 rounded-lg flex-row items-center`}
            >
              <Ionicons name={ratingIcon} size={18} color={ratingColor} />
              <Text
                className={`text-sm font-bold ml-2 ${
                  ratingStyle.split(" ")[2]
                }`}
              >
                {feedback.rating.replace("_", " ").toUpperCase()}
              </Text>
            </View>
          </View>

          <Text className="text-base text-gray-900 mb-5 leading-6">
            {feedback.message}
          </Text>

          {/* Strengths */}
          {feedback.strengths && feedback.strengths.length > 0 && (
            <View className="mb-5">
              <Text className="text-base font-semibold text-gray-900 mb-2">
                💪 Strengths
              </Text>
              {feedback.strengths.map((item, index) => (
                <View key={index} className="mb-2">
                  <Text className="text-sm text-gray-600 leading-5">
                    • {item}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Suggestions */}
          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <View className="mb-5">
              <Text className="text-base font-semibold text-gray-900 mb-2">
                💡 Suggestions
              </Text>
              {feedback.suggestions.map((item, index) => (
                <View key={index} className="mb-2">
                  <Text className="text-sm text-gray-600 leading-5">
                    • {item}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Next Steps */}
          {feedback.next_steps && feedback.next_steps.length > 0 && (
            <View className="mb-5">
              <Text className="text-base font-semibold text-gray-900 mb-2">
                🎯 Next Steps
              </Text>
              {feedback.next_steps.map((item, index) => (
                <View key={index} className="mb-2">
                  <Text className="text-sm text-gray-600 leading-5">
                    • {item}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Alternative detections */}
          {feedback.also_detected && feedback.also_detected.length > 0 && (
            <View className="mt-4 p-3 bg-gray-50 rounded-lg">
              <Text className="text-xs text-gray-600">
                Also detected: {feedback.also_detected.join(", ")}
              </Text>
            </View>
          )}

          {/* Note if low confidence */}
          {feedback.note && (
            <View className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <Text className="text-xs text-yellow-800">{feedback.note}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="bg-blue-500 px-5 py-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">
            AI Video Analyzer
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
          {/* Info Card */}
          <View className="bg-white rounded-xl p-5 items-center mb-5 shadow-sm border border-gray-100">
            <Ionicons name="information-circle" size={32} color="#0ea5e9" />
            <Text className="text-lg font-bold text-gray-900 mt-2.5 mb-2">
              Analyze Your Surfing Technique
            </Text>
            <Text className="text-sm text-gray-600 text-center leading-5">
              Upload a video of your surfing and get AI-powered feedback on your
              technique, form, and areas for improvement.
            </Text>
          </View>

          {/* Video Selection */}
          <View className="bg-white rounded-xl p-5 mb-5 shadow-sm border border-gray-100">
            <TouchableOpacity
              className="bg-blue-500 rounded-xl p-5 flex-row items-center justify-center"
              onPress={pickVideo}
              disabled={analyzing}
              activeOpacity={0.7}
            >
              <Ionicons name="videocam" size={32} color="white" />
              <Text className="text-white text-base font-semibold ml-2.5">
                {selectedVideo ? "Change Video" : "Select Video"}
              </Text>
            </TouchableOpacity>

            {selectedVideo && (
              <View className="flex-row items-center mt-4 p-3 bg-green-50 rounded-lg">
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text className="text-green-800 text-sm ml-2 flex-1">
                  Video selected: {selectedVideo.fileName || "Video"}
                </Text>
              </View>
            )}

            {/* Analyze Button */}
            {selectedVideo && !analyzing && (
              <TouchableOpacity
                className="bg-green-500 rounded-xl p-4 flex-row items-center justify-center mt-4"
                onPress={analyzeVideo}
                activeOpacity={0.7}
              >
                <Ionicons name="analytics" size={24} color="white" />
                <Text className="text-white text-base font-semibold ml-2.5">
                  Analyze Video
                </Text>
              </TouchableOpacity>
            )}

            {/* Loading */}
            {analyzing && (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#0ea5e9" />
                <Text className="mt-4 text-base text-gray-900 font-semibold">
                  {uploadProgress < 100
                    ? `Uploading... ${uploadProgress}%`
                    : "Analyzing your technique..."}
                </Text>
                <Text className="mt-1 text-sm text-gray-600">
                  This may take a minute
                </Text>
              </View>
            )}
          </View>

          {/* Results */}
          {renderFeedback()}

          {/* Tips */}
          <View className="bg-white rounded-xl p-5 mb-5 shadow-sm border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              📝 Tips for Best Results
            </Text>
            <View className="mb-2">
              <Text className="text-sm text-gray-600 leading-5">
                • Ensure the surfer is clearly visible in the video
              </Text>
            </View>
            <View className="mb-2">
              <Text className="text-sm text-gray-600 leading-5">
                • Use videos with good lighting conditions
              </Text>
            </View>
            <View className="mb-2">
              <Text className="text-sm text-gray-600 leading-5">
                • Keep video size under 50MB for faster processing
              </Text>
            </View>
            <View className="mb-2">
              <Text className="text-sm text-gray-600 leading-5">
                • Focus on one specific technique per video
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
