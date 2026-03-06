import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSurfTutorProfile } from "../context/SurfTutorProfileContext.jsx";
import SurfTutorQuizScreen from "../components/SurfTutorQuizScreen.jsx";

export default function AITutorHome() {
  const router = useRouter();
  const { profile, isLoading, isQuizCompleted, refreshProfile, clearProfile } = useSurfTutorProfile();

  const features = [
    {
      id: 1,
      title: "Cardio Plans",
      description:
        "Get personalized AI-generated cardio workout recommendations",
      icon: "fitness",
      color: "#FF6B6B",
      screen: "CardioPlans",
    },
    {
      id: 2,
      title: "AI-Powered AR Coach",
      description: "Personalized surfing recommendations and AR visualizations",
      icon: "cube-outline",
      color: "#4ECDC4",
      screen: "ARVisualization",
    },
   
    {
      id: 4,
      title: "Progress",
      description: "Track your progress, badges, and achievements",
      icon: "trending-up",
      color: "#96CEB4",
      screen: "Progress",
    },
  ];

  const handleFeaturePress = (feature) => {
    router.push(`/aiTutor/${feature.screen}`);
  };

  const handleQuizComplete = async () => {
    await refreshProfile();
  };

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4 text-base">Loading your profile...</Text>
      </View>
    );
  }

  // Show quiz if not completed
  if (!isQuizCompleted) {
    return <SurfTutorQuizScreen onComplete={handleQuizComplete} />;
  }

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      {/* Header with gradient */}
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={["top"]} className="px-6 pb-4">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold flex-1">
              🏄 AI Surf Tutor
            </Text>
            <TouchableOpacity 
              onPress={async () => {
                await clearProfile();
                await refreshProfile();
              }}
              className="w-9 h-9 rounded-full bg-white/20 items-center justify-center"
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text className="text-blue-100 text-sm">
            Your Personal Surfing Coach
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1 px-6 py-6"
          showsVerticalScrollIndicator={false}
        >
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100"
              onPress={() => handleFeaturePress(feature)}
            >
              <View className="flex-row items-center">
                <View
                  className="w-14 h-14 rounded-lg items-center justify-center mr-4"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <Ionicons
                    name={feature.icon}
                    size={28}
                    color={feature.color}
                  />
                </View>

                <View className="flex-1">
                  <Text className="font-semibold text-lg text-gray-900 mb-1">
                    {feature.title}
                  </Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    {feature.description}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
