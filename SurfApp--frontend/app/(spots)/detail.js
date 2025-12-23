import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ForecastChart from "../../components/ForecastChart";
import ScoreBreakdown from "../../components/ScoreBreakdown";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../hooks/useAuth";
import { startSession, endSession } from "../../data/surfApi";

const SpotDetailScreen = () => {
  const router = useRouter();
  const { origin, scrollToSession } = useLocalSearchParams();
  const { user } = useAuth();
  const {
    selectedSpot: contextSpot,
    activeSessionId,
    setActiveSession,
    clearActiveSession,
  } = useUser();
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [sessionRating, setSessionRating] = useState(3);
  const [wouldReturn, setWouldReturn] = useState(true);
  const [sessionComments, setSessionComments] = useState("");

  const scrollViewRef = useRef(null);
  const [sessionButtonY, setSessionButtonY] = useState(0);

  const spot = contextSpot;

  // Scroll to session button when navigating from banner
  useEffect(() => {
    if (
      scrollToSession === "true" &&
      sessionButtonY > 0 &&
      scrollViewRef.current
    ) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: sessionButtonY - 100,
          animated: true,
        });
      }, 500);
    }
  }, [scrollToSession, sessionButtonY]);

  if (!spot) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Spot Details",
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
            ),
          }}
        />
        <View className="flex-1 justify-center items-center p-10">
          <Text className="text-5xl mb-4">⚠️</Text>
          <Text className="text-base text-gray-600">
            Spot details could not be loaded.
          </Text>
        </View>
      </>
    );
  }

  const forecast = spot.forecast || {};
  const tide = forecast.tide || {};

  const score =
    typeof spot.score === "number" && !isNaN(spot.score) ? spot.score : 0;
  const suitabilityLabel = spot.suitability || "Unknown";

  const breakdown = spot.breakdown || {};
  const recommendations = spot.recommendations || [];
  const weights = spot.weights || {};
  const warnings = spot.warnings || [];

  const getGradientColors = () => {
    if (score >= 75) return ["#4ade80", "#22c55e"];
    if (score >= 50) return ["#fbbf24", "#f59e0b"];
    if (score >= 25) return ["#fb923c", "#f97316"];
    return ["#f87171", "#ef4444"];
  };

  const handleStartSession = async () => {
    if (!user?._id) {
      Alert.alert(
        "Login Required",
        "Please log in to track your surf sessions.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/login") },
        ]
      );
      return;
    }

    try {
      const conditions = {
        waveHeight: forecast.waveHeight,
        wavePeriod: forecast.wavePeriod,
        windSpeed: forecast.windSpeed,
        windDirection: forecast.windDirection,
        tide: tide.status,
        region: spot.region || "Unknown",
      };

      const session = await startSession(
        user._id,
        spot.id,
        spot.name,
        conditions
      );

      if (session && session.sessionId) {
        setActiveSession(session.sessionId, spot);
        setTimeout(() => {
          Alert.alert(
            "Session Started",
            'Have a great surf! Tap "End Session" when you\'re done.'
          );
        }, 100);
      }
    } catch (error) {
      console.error("Start session error:", error);
      Alert.alert("Error", "Failed to start session. Please try again.");
    }
  };

  const handleEndSession = async () => {
    try {
      await endSession(
        activeSessionId,
        sessionRating,
        wouldReturn,
        sessionComments
      );

      clearActiveSession();
      setShowEndSessionModal(false);
      setSessionRating(3);
      setWouldReturn(true);
      setSessionComments("");

      setTimeout(() => {
        Alert.alert(
          "Session Ended",
          "Thanks for the feedback! Your session has been saved."
        );
      }, 100);
    } catch (error) {
      console.error("End session error:", error);
      clearActiveSession();
      setShowEndSessionModal(false);
      setSessionRating(3);
      setWouldReturn(true);
      setSessionComments("");
      Alert.alert("Info", "Session ended locally. Check your connection.");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: spot.name,
          headerStyle: { backgroundColor: "#2563eb" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView ref={scrollViewRef} className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-8 items-center"
        >
          <Text className="text-4xl font-bold text-white mb-2">
            {spot.name}
          </Text>
          <Text className="text-lg text-white/90 mb-6">{spot.region}</Text>
          <View className="bg-white/20 px-6 py-4 rounded-2xl border-2 border-white/30 items-center">
            <Text className="text-5xl font-bold text-white">
              {Math.round(score)}%
            </Text>
            <Text className="text-sm text-white font-semibold mt-1 uppercase tracking-wider">
              {suitabilityLabel}
            </Text>
          </View>
        </LinearGradient>

        {/* Current Conditions */}
        <View className="p-5">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            🌊 Current Conditions
          </Text>

          {/* Score Breakdown */}
          <ScoreBreakdown
            breakdown={breakdown}
            recommendations={recommendations}
            weights={weights}
            warnings={warnings}
            canSurf={spot.canSurf}
          />

          {/* Conditions Grid */}
          <View className="flex-row flex-wrap mx-1">
            <View className="w-1/3 p-1.5">
              <View className="bg-white p-3 rounded-xl items-center shadow-sm">
                <Text className="text-3xl mb-2">🌊</Text>
                <Text className="text-[11px] text-gray-600 font-medium uppercase tracking-wide text-center">
                  Wave Height
                </Text>
                <Text className="text-lg font-bold text-gray-900 text-center mt-1">
                  {forecast.waveHeight}m
                </Text>
              </View>
            </View>

            <View className="w-1/3 p-1.5">
              <View className="bg-white p-3 rounded-xl items-center shadow-sm">
                <Text className="text-3xl mb-2">⏱️</Text>
                <Text className="text-[11px] text-gray-600 font-medium uppercase tracking-wide text-center">
                  Wave Period
                </Text>
                <Text className="text-lg font-bold text-gray-900 text-center mt-1">
                  {forecast.wavePeriod}s
                </Text>
              </View>
            </View>

            <View className="w-1/3 p-1.5">
              <View className="bg-white p-3 rounded-xl items-center shadow-sm">
                <Text className="text-3xl mb-2">💨</Text>
                <Text className="text-[11px] text-gray-600 font-medium uppercase tracking-wide text-center">
                  Wind Speed
                </Text>
                <Text className="text-lg font-bold text-gray-900 text-center mt-1">
                  {forecast.windSpeed} kph
                </Text>
              </View>
            </View>

            <View className="w-1/3 p-1.5">
              <View className="bg-white p-3 rounded-xl items-center shadow-sm">
                <Text className="text-3xl mb-2">🧭</Text>
                <Text className="text-[11px] text-gray-600 font-medium uppercase tracking-wide text-center">
                  Wind Direction
                </Text>
                <Text className="text-lg font-bold text-gray-900 text-center mt-1">
                  {forecast.windDirection}°
                </Text>
              </View>
            </View>

            <View className="w-1/3 p-1.5">
              <View className="bg-white p-3 rounded-xl items-center shadow-sm">
                <Text className="text-3xl mb-2">🌙</Text>
                <Text className="text-[11px] text-gray-600 font-medium uppercase tracking-wide text-center">
                  Tide Status
                </Text>
                <Text className="text-lg font-bold text-gray-900 text-center mt-1">
                  {tide.status}
                </Text>
              </View>
            </View>

            <View className="w-1/3 p-1.5">
              <View className="bg-white p-3 rounded-xl items-center shadow-sm">
                <Text className="text-3xl mb-2">📊</Text>
                <Text className="text-[11px] text-gray-600 font-medium uppercase tracking-wide text-center">
                  Score
                </Text>
                <Text className="text-lg font-bold text-gray-900 text-center mt-1">
                  {Math.round(score)}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Session Tracking */}
        <View
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            setSessionButtonY(layout.y);
          }}
          className="px-5 py-4"
        >
          {!activeSessionId ? (
            <TouchableOpacity
              onPress={handleStartSession}
              className="bg-blue-600 flex-row items-center justify-center p-4 rounded-xl shadow-md active:opacity-90"
            >
              <Text className="text-2xl mr-3">🏄‍♂️</Text>
              <Text className="text-white text-lg font-bold">
                Start Surf Session
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setShowEndSessionModal(true)}
              className="bg-orange-500 flex-row items-center justify-center p-4 rounded-xl shadow-md active:opacity-90"
            >
              <Text className="text-2xl mr-3">🛑</Text>
              <Text className="text-white text-lg font-bold">
                End Session & Rate
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Forecast Chart */}
        <View className="p-5">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            📈 7-Day Wave Forecast
          </Text>
          <View className="bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100">
            {/* Pass spotId and let ForecastChart fetch real 7-day data */}
            <ForecastChart spotId={spot.id} />
          </View>
        </View>

        {/* Tips Section */}
        <View className="px-5 py-4 bg-gray-100">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            💡 Surf Tips
          </Text>

          <View className="bg-white rounded-xl flex-row p-4 mb-3 shadow-sm">
            <Text className="text-3xl mr-3">🏄‍♂️</Text>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900 mb-1">
                Best For
              </Text>
              <Text className="text-sm text-gray-600">
                {score >= 75
                  ? "All skill levels - Perfect conditions!"
                  : score >= 50
                  ? "Intermediate to Advanced surfers"
                  : score >= 25
                  ? "Experienced surfers only"
                  : "Challenging conditions - Exercise caution"}
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-xl flex-row p-4 shadow-sm mb-6">
            <Text className="text-3xl mr-3">⏰</Text>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900 mb-1">
                Recommended Time
              </Text>
              <Text className="text-sm text-gray-600">
                {tide.status === "High"
                  ? "High tide - Good for beginners"
                  : tide.status === "Low"
                  ? "Low tide - Watch for rocks"
                  : "Mid tide - Generally good conditions"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* End Session Modal */}
      <Modal
        visible={showEndSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEndSessionModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-center items-center p-4">
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View className="bg-white rounded-3xl p-6 w-full max-w-md">
            <Text className="text-2xl font-bold text-gray-900 text-center mb-6">
              Rate Your Session
            </Text>

            <Text className="text-base font-semibold text-gray-700 mb-3">
              How was your session?
            </Text>
            <View className="flex-row justify-between mb-6">
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  onPress={() => setSessionRating(rating)}
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    sessionRating === rating ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={`text-lg font-bold ${
                      sessionRating === rating ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-base font-semibold text-gray-700 mb-3">
              Would you surf here again?
            </Text>
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                onPress={() => setWouldReturn(true)}
                className={`flex-1 py-3 rounded-lg items-center ${
                  wouldReturn ? "bg-green-600" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    wouldReturn ? "text-white" : "text-gray-600"
                  }`}
                >
                  Yes 👍
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setWouldReturn(false)}
                className={`flex-1 py-3 rounded-lg items-center ${
                  !wouldReturn ? "bg-green-600" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    !wouldReturn ? "text-white" : "text-gray-600"
                  }`}
                >
                  No 👎
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-base font-semibold text-gray-700 mb-3">
              Comments (optional)
            </Text>
            <TextInput
              placeholder="How were the waves? Any tips?"
              multiline
              numberOfLines={3}
              value={sessionComments}
              onChangeText={setSessionComments}
              className="bg-gray-100 rounded-lg p-3 text-base text-gray-900 mb-6"
              placeholderTextColor="#9ca3af"
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={Keyboard.dismiss}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowEndSessionModal(false)}
                className="flex-1 py-3 rounded-lg bg-gray-200 items-center"
              >
                <Text className="text-base font-semibold text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEndSession}
                className="flex-1 py-3 rounded-lg bg-blue-600 items-center"
              >
                <Text className="text-base font-semibold text-white">
                  Submit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
</Modal>
    </>
  );
};

export default SpotDetailScreen;
