import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import SafeLinearGradient from "./SafeLinearGradient.jsx";
import { cardioAPI } from "../services/api.js";
import { useCardioProfile } from "../context/CardioProfileContext.jsx";
import CardioQuizScreen from "./CardioQuizScreen.jsx";
import WorkoutExecutionScreen from "./WorkoutExecutionScreen.jsx";
import PlanExplanationModal from "./PlanExplanationModal.jsx";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  calculateAdaptiveAdjustments,
  WorkoutProgress,
} from "../utils/adaptiveProgress.js";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const WORKOUT_PROGRESS_KEY = "@workout_progress";
const PLAN_HISTORY_KEY = "@cardio_plan_history";

/**
 * @typedef {Object} WorkoutPlan
 * @property {string} [planName]
 * @property {string} [skillLevel]
 * @property {string} [goal]
 * @property {string} [equipment]
 * @property {number} [durationMinutes]
 * @property {string} [focus]
 * @property {string|string[]} [exercises]
 */

// ✅ Animated Card Component
/**
 * @param {any} props
 */
const AnimatedPlanCard = ({ plan, index, onStartWorkout, onExplain }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 100,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay: index * 100,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const exercises =
    typeof plan.exercises === "string"
      ? plan.exercises.split(";").map((e) => e.trim())
      : Array.isArray(plan.exercises)
      ? plan.exercises.map((e) => 
          typeof e === "object" && e !== null ? (e.name || e.exercise || String(e)) : String(e || '')
        )
      : [];

  return (
    <Animated.View
      style={[
        styles.planCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <SafeLinearGradient
        colors={["#4169E1", "#5B8DEF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.planGradient}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planName}>
            {plan.planName || `Workout Plan ${index + 1}`}
          </Text>
          {plan.equipment && plan.equipment !== "None" && (
            <View style={styles.equipmentBadge}>
              <Icon name="fitness-center" size={14} color="#fff" />
              <Text style={styles.equipmentBadgeText}>{plan.equipment}</Text>
            </View>
          )}
        </View>

        <View style={styles.planStats}>
          {plan.durationMinutes && (
            <View style={styles.statItem}>
              <Icon name="schedule" size={18} color="#fff" />
              <Text style={styles.statText}>{plan.durationMinutes} min</Text>
            </View>
          )}
          {exercises.length > 0 && (
            <View style={styles.statItem}>
              <Icon name="list" size={18} color="#fff" />
              <Text style={styles.statText}>{exercises.length} exercises</Text>
            </View>
          )}
          {plan.focus && (
            <View style={styles.statItem}>
              <Icon name="whatshot" size={18} color="#fff" />
              <Text style={styles.statText}>{plan.focus}</Text>
            </View>
          )}
        </View>
      </SafeLinearGradient>

      {exercises.length > 0 && (
        <View style={styles.exercisesPreview}>
          <Text style={styles.exercisesTitle}>Exercises Preview:</Text>
          {exercises.slice(0, 4).map((exercise, exIndex) => (
            <View key={exIndex} style={styles.exercisePreviewItem}>
              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>{exIndex + 1}</Text>
              </View>
              <Text style={styles.exerciseText} numberOfLines={1}>
                {exercise}
              </Text>
            </View>
          ))}
          {exercises.length > 4 && (
            <Text style={styles.moreExercisesText}>
              +{exercises.length - 4} more exercises
            </Text>
          )}
        </View>
      )}

      <View style={styles.planActions}>
        <TouchableOpacity style={styles.infoButton} onPress={onExplain}>
          <Icon name="info-outline" size={20} color="#667eea" />
          <Text style={styles.infoButtonText}>Why this?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.startButton} onPress={onStartWorkout}>
          <SafeLinearGradient
            colors={["#667eea", "#764ba2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Icon name="play-arrow" size={22} color="#fff" />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </SafeLinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function CardioPlansScreen() {
  const router = useRouter();
  const {
    profile,
    isLoading: profileLoading,
    isQuizCompleted,
    refreshProfile,
  } = useCardioProfile();
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [explanationPlan, setExplanationPlan] = useState(null);
  const [adaptiveAdjustments, setAdaptiveAdjustments] = useState(null);

  // ✅ Animations
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!profileLoading && isQuizCompleted && profile) {
      handleGetRecommendations();
    }
  }, [profileLoading, isQuizCompleted, profile]);

  const handleQuizComplete = async () => {
    setShowQuiz(false);
    await refreshProfile();
    setTimeout(() => {
      handleGetRecommendations();
    }, 100);
  };

  /**
   * @returns {Promise<WorkoutProgress[]>}
   */
  const loadCardioWorkouts = async () => {
    try {
      const data = await AsyncStorage.getItem(WORKOUT_PROGRESS_KEY);
      if (data) {
        return JSON.parse(data) || [];
      }
      return [];
    } catch (error) {
      console.error("Error loading cardio workouts:", error);
      return [];
    }
  };

  /**
   * @param {WorkoutPlan[]} plans
   */
  const savePlanToHistory = async (plans) => {
    try {
      const existing = await AsyncStorage.getItem(PLAN_HISTORY_KEY);
      const history = existing ? JSON.parse(existing) : [];

      const plansToSave = plans.map((plan) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        planName: plan.planName || "Workout Plan",
        exercises:
          typeof plan.exercises === "string"
            ? plan.exercises.split(";").map((e) => e.trim())
            : Array.isArray(plan.exercises)
            ? plan.exercises
            : [],
        durationMinutes: plan.durationMinutes || 30,
        skillLevel: plan.skillLevel || profile?.fitnessLevel || "Beginner",
        goal: plan.goal || profile?.goal || "",
        generatedAt: new Date().toISOString(),
        quizAnswers: profile
          ? {
              fitnessLevel: profile.fitnessLevel,
              goal: profile.goal,
              duration: profile.trainingDuration,
              equipment: profile.equipment || "None",
              bmi:
                profile.height && profile.weight
                  ? (
                      profile.weight / Math.pow(profile.height / 100, 2)
                    ).toFixed(1)
                  : "N/A",
              limitations: profile.limitations || [],
            }
          : undefined,
      }));

      const updatedHistory = [...plansToSave, ...history].slice(0, 10);
      await AsyncStorage.setItem(
        PLAN_HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error("Error saving plan history:", error);
    }
  };

  const handleGetRecommendations = async () => {
    if (
      !profile ||
      !profile.fitnessLevel ||
      !profile.goal ||
      !profile.trainingDuration
    ) {
      Alert.alert("Error", "Please complete the fitness quiz first");
      return;
    }

    setLoading(true);
    try {
      const workouts = await loadCardioWorkouts();
      const safeWorkouts = Array.isArray(workouts) ? workouts : [];
      const recentWorkouts = safeWorkouts.slice(-5);
      const adjustments = calculateAdaptiveAdjustments(recentWorkouts);
      setAdaptiveAdjustments(adjustments);

      const skillLevel = profile.fitnessLevel;
      let goal = [];

      if (profile.goal === "Warm up only") {
        goal = ["Warmup"];
      } else if (profile.goal === "Improve endurance") {
        goal = ["Endurance", "Stamina"];
      } else if (profile.goal === "Improve explosive pop-up speed") {
        goal = ["Power"];
      }

      const userDetails = {};
      if (profile.height) userDetails.height = profile.height;
      if (profile.weight) userDetails.weight = profile.weight;
      if (profile.height && profile.weight) {
        userDetails.bmi = profile.weight / Math.pow(profile.height / 100, 2);
      }

      const response = await cardioAPI.getRecommendations(
        skillLevel,
        goal,
        Object.keys(userDetails).length > 0 ? userDetails : undefined,
        profile.trainingDuration,
        profile.limitations &&
          profile.limitations.length > 0 &&
          !profile.limitations.includes("None")
          ? profile.limitations
          : undefined,
        profile.equipment || "None",
        Object.keys(adjustments).length > 0 ? adjustments : undefined
      );

      // Handle response - expecting {plans: [...]} from upgraded ML server
      if (response.plans && Array.isArray(response.plans)) {
        console.log(`✅ Received ${response.plans.length} diverse workout plans from ML server`);
        setRecommendations(response.plans);
        await savePlanToHistory(response.plans);
      } else if (
        response.recommendedPlans &&
        Array.isArray(response.recommendedPlans)
      ) {
        setRecommendations(response.recommendedPlans);
        await savePlanToHistory(response.recommendedPlans);
      } else if (response.recommendedExercises) {
        const exercises = Array.isArray(response.recommendedExercises)
          ? response.recommendedExercises
          : [response.recommendedExercises];
        const plans = exercises.map((ex, idx) => ({
          planName: `Workout Plan ${idx + 1}`,
          skillLevel,
          goal: goal.join(", "),
          exercises: typeof ex === "string" ? ex.split(";") : ex,
          durationMinutes: 30,
          focus: goal.join(", "),
        }));
        setRecommendations(plans);
      } else {
        Alert.alert("Error", "No recommendations received");
      }
    } catch (error) {
      // Backend is optional - use warn for network errors
      const isNetworkError =
        error.message?.includes("Cannot connect to backend") ||
        error.code === "ECONNABORTED" ||
        error.message === "Network Error" ||
        error.code === "ERR_NETWORK";

      if (isNetworkError) {
        console.warn("[Cardio] Backend unavailable - recommendations disabled");
        Alert.alert(
          "Backend Connection Error",
          "Cannot connect to the backend server.\n\n" +
            "Please make sure:\n" +
            "1. Backend server is running (npm start in surfapp--backend)\n" +
            "2. Your device and PC are on the same network\n" +
            "3. Firewall allows port 3000\n\n" +
            "Android Emulator uses: 10.0.2.2:3000\n" +
            "Physical device needs your PC's IP address",
          [{ text: "OK" }]
        );
      } else {
        console.error("❌ Error getting recommendations:", error);
        const errorData = error.response?.data || {};
        const errorMsg = errorData.error || "Failed to get recommendations";
        const errorDetails = errorData.details || "";

        let displayMessage = errorMsg;
        if (errorDetails) {
          displayMessage += `\n\n${errorDetails}`;
        }

        if (
          errorMsg.includes("Model server") ||
          errorMsg.includes("model server")
        ) {
          displayMessage =
            "AI Model Server Error\n\n" +
            (errorDetails ||
              "The AI model server is not running. Please ensure the Python model server is started on port 8000.");
        }

        Alert.alert("Error", displayMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutComplete = () => {
    setSelectedWorkout(null);
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedWorkout) {
    return (
      <WorkoutExecutionScreen
        workoutPlan={selectedWorkout}
        onComplete={handleWorkoutComplete}
      />
    );
  }

  if (showQuiz || !isQuizCompleted) {
    return <CardioQuizScreen onComplete={handleQuizComplete} />;
  }

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      {/* Header with gradient extending to notch */}
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={["top"]} className="px-6 pb-4 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              className="mr-4 w-9 h-9 rounded-full bg-white/20 items-center justify-center"
              onPress={() => router.back()}
            >
              <Icon name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-2xl font-bold">Cardio Plans</Text>
              <Text className="text-blue-100 text-sm">Personalized workouts for you</Text>
            </View>
          </View>
          <View className="flex-row space-x-3">
            <TouchableOpacity onPress={() => router.push("/cardio-history")}>
              <Icon name="history" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowQuiz(true)}>
              <Icon name="refresh" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
        >

        {/* Profile Info Card */}
        {profile && (
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Icon name="person" size={32} color="#4169E1" />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Your Profile</Text>
                <Text style={styles.profileLevel}>{profile.fitnessLevel}</Text>
              </View>
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.profileDetailItem}>
                <Icon name="flag" size={16} color="#666" />
                <Text style={styles.profileDetailText}>{profile.goal}</Text>
              </View>
              <View style={styles.profileDetailItem}>
                <Icon name="schedule" size={16} color="#666" />
                <Text style={styles.profileDetailText}>
                  {profile.trainingDuration}
                </Text>
              </View>
              {profile.equipment && profile.equipment !== "None" && (
                <View style={styles.profileDetailItem}>
                  <Icon name="fitness-center" size={16} color="#666" />
                  <Text style={styles.profileDetailText}>
                    {profile.equipment}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Recommendations */}
        {loading ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color="#4169E1" />
            <Text style={styles.loadingText}>
              Generating your personalized plans...
            </Text>
            <Text style={styles.loadingSubtext}>
              This may take a few seconds
            </Text>
          </View>
        ) : recommendations.length > 0 ? (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>
              ✨ Your Personalized Plans ({recommendations.length})
            </Text>
            {recommendations.map((plan, index) => (
              <AnimatedPlanCard
                key={index}
                plan={plan}
                index={index}
                onStartWorkout={() => setSelectedWorkout(plan)}
                onExplain={() => setExplanationPlan(plan)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="fitness-center" size={80} color="#e0e0e0" />
            <Text style={styles.emptyStateTitle}>No Plans Yet</Text>
            <Text style={styles.emptyStateText}>
              Complete the quiz to get personalized workout recommendations
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowQuiz(true)}
            >
              <Text style={styles.emptyStateButtonText}>Take Fitness Quiz</Text>
            </TouchableOpacity>
          </View>
        )}
        </ScrollView>
      </View>

      {explanationPlan && profile && (
        <PlanExplanationModal
          visible={!!explanationPlan}
          plan={explanationPlan}
          quizAnswers={profile}
          adaptiveAdjustments={adaptiveAdjustments}
          onClose={() => setExplanationPlan(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingSection: {
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
  headerSection: {
    marginBottom: 16,
  },
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 4,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  profileLevel: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
    marginTop: 2,
  },
  profileDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  profileDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  profileDetailText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },
  recommendationsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planGradient: {
    padding: 16,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
  },
  equipmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  equipmentBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },
  planStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 6,
    fontWeight: "500",
  },
  exercisesPreview: {
    padding: 20,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  exercisePreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#667eea",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  exerciseText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  moreExercisesText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 8,
  },
  planActions: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    flex: 1,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
    marginLeft: 6,
  },
  startButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 6,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: "#667eea",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
