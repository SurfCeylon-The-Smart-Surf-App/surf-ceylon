import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import {
  getBadgeById,
  getBadgesByCategory,
  getNextBadge,
  getTierColor,
  Badge,
} from "../utils/badges.js";
import {
  calculateCardioStats,
  getBadgeProgress,
  BadgeProgress,
  PoseStats,
  ARStats,
  checkPoseBadges,
  checkARBadges,
} from "../utils/badgeSystem.js";
import { formatProgress } from "../utils/progressFormatter.js";
import { progressAPI } from "../services/api.js";

const WORKOUT_PROGRESS_KEY = "@workout_progress";
const CARDIO_BADGES_KEY = "@cardio_badges";
const POSE_BADGES_KEY = "@pose_badges";
const AR_BADGES_KEY = "@ar_badges";

// Helper function to calculate Pose stats from progress data
/**
 * @param {any} progressData
 * @returns {PoseStats}
 */
function calculatePoseStats(progressData) {
  const poseData = progressData?.pose || progressData?.poseEstimation || {};
  const drills = poseData.drills || {};
  const completedDrills = Object.keys(drills).filter(
    (drillId) => drills[drillId]?.completed > 0
  );
  const scores = {};

  Object.keys(drills).forEach((drillId) => {
    if (drills[drillId]?.bestScore) {
      scores[drillId] = [drills[drillId].bestScore];
    }
  });

  const totalTime = poseData.totalTime || 0; // in seconds
  const sessions = poseData.sessions || 0;

  return {
    completedDrills,
    scores,
    totalTime,
    sessions,
  };
}

// Helper function to calculate AR stats from progress data
/**
 * @param {any} progressData
 * @returns {ARStats}
 */
function calculateARStats(progressData) {
  const arData = progressData?.ar || {};
  const modules = arData.modules || {};
  const completedModules = Object.keys(modules).filter(
    (moduleId) => modules[moduleId]?.completed > 0
  );
  const totalTime = arData.totalTime || 0; // in seconds
  const sessions = arData.sessions || 0;

  return {
    completedModules,
    totalTime,
    sessions,
  };
}

export default function ProgressScreen() {
  const router = useRouter();
  const [cardioWorkouts, setCardioWorkouts] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [poseEarnedBadges, setPoseEarnedBadges] = useState([]);
  const [arEarnedBadges, setArEarnedBadges] = useState([]);
  const [badgeProgress, setBadgeProgress] = useState({});
  const [poseProgress, setPoseProgress] = useState(null);
  const [arProgress, setArProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load cardio workouts
      const workoutsData = await AsyncStorage.getItem(WORKOUT_PROGRESS_KEY);
      const workouts = workoutsData ? JSON.parse(workoutsData) : [];
      setCardioWorkouts(workouts);

      // Load earned badges for all modules
      const cardioBadgesData = await AsyncStorage.getItem(CARDIO_BADGES_KEY);
      const cardioBadges = cardioBadgesData ? JSON.parse(cardioBadgesData) : [];
      setEarnedBadges(cardioBadges);

      const poseBadgesData = await AsyncStorage.getItem(POSE_BADGES_KEY);
      const poseBadges = poseBadgesData ? JSON.parse(poseBadgesData) : [];
      setPoseEarnedBadges(poseBadges);

      const arBadgesData = await AsyncStorage.getItem(AR_BADGES_KEY);
      const arBadges = arBadgesData ? JSON.parse(arBadgesData) : [];
      setArEarnedBadges(arBadges);

      // Load badge progress
      const progressData = await getBadgeProgress();
      setBadgeProgress(progressData);

      // Load pose and AR progress from progressAPI
      try {
        const progressResponse = await progressAPI.loadProgress();
        const allProgress = progressResponse.progress || {};
        setPoseProgress(allProgress);
        setArProgress(allProgress);
      } catch (error) {
        console.warn("Could not load pose/AR progress:", error);
      }
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  const stats = calculateCardioStats(cardioWorkouts);
  const nextBadge = getNextBadge("cardio", earnedBadges);

  // Calculate Pose stats
  const poseStatsData = calculatePoseStats(poseProgress);
  const poseFormatted = formatProgress("pose", {
    totalMinutes: Math.floor(poseStatsData.totalTime / 60),
    sessions: poseStatsData.sessions,
    scores: poseStatsData.scores,
  });
  const poseNextBadge = getNextBadge("poseEstimation", poseEarnedBadges);

  // Calculate AR stats
  const arStatsData = calculateARStats(arProgress);
  const arFormatted = formatProgress("ar", {
    totalMinutes: Math.floor(arStatsData.totalTime / 60),
    sessions: arStatsData.sessions,
    completedModules: arStatsData.completedModules,
  });
  const arNextBadge = getNextBadge("ar", arEarnedBadges);

  /**
   * @param {number} minutes
   * @returns {string}
   */
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Calculate average accuracy for pose
  /**
   * @returns {number}
   */
  const calculatePoseAccuracy = () => {
    const allScores = [];
    Object.values(poseStatsData.scores).forEach((scoreArray) => {
      if (Array.isArray(scoreArray)) {
        allScores.push(...scoreArray);
      }
    });
    if (allScores.length === 0) return 0;
    const avg =
      allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    return Math.round(avg);
  };

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
              <Text className="text-white text-2xl font-bold">Progress</Text>
              <Text className="text-blue-100 text-sm">Track your fitness journey</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1 px-6 py-6"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >

        {/* Tab Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "stats" && styles.tabActive]}
              onPress={() => setActiveTab("stats")}
            >
              <Icon
                name="fitness-center"
                size={18}
                color={activeTab === "stats" ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "stats" && styles.tabTextActive,
                ]}
              >
                Cardio
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "pose" && styles.tabActive]}
              onPress={() => setActiveTab("pose")}
            >
              <Icon
                name="accessibility"
                size={18}
                color={activeTab === "pose" ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "pose" && styles.tabTextActive,
                ]}
              >
                Pose
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "ar" && styles.tabActive]}
              onPress={() => setActiveTab("ar")}
            >
              <Icon
                name="view-in-ar"
                size={18}
                color={activeTab === "ar" ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "ar" && styles.tabTextActive,
                ]}
              >
                AR
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "badges" && styles.tabActive]}
              onPress={() => setActiveTab("badges")}
            >
              <Icon
                name="emoji-events"
                size={18}
                color={activeTab === "badges" ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "badges" && styles.tabTextActive,
                ]}
              >
                Badges
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "history" && styles.tabActive]}
              onPress={() => setActiveTab("history")}
            >
              <Icon
                name="history"
                size={18}
                color={activeTab === "history" ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "history" && styles.tabTextActive,
                ]}
              >
                History
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* CARDIO STATS TAB */}
        {activeTab === "stats" && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Icon name="fitness-center" size={32} color="#007AFF" />
                <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="schedule" size={32} color="#4CAF50" />
                <Text style={styles.statValue}>
                  {formatTime(stats.totalMinutes)}
                </Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="local-fire-department" size={32} color="#FF6B4A" />
                <Text style={styles.statValue}>{stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="whatshot" size={32} color="#FF5722" />
                <Text style={styles.statValue}>{stats.totalCalories}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
            </View>

            {/* Next Badge Progress */}
            {nextBadge && (
              <View style={styles.nextBadgeContainer}>
                <Text style={styles.sectionTitle}>🎯 Next Badge</Text>
                <BadgeProgressCard
                  badge={nextBadge}
                  progress={badgeProgress[nextBadge.id]}
                  isNext={true}
                />
              </View>
            )}

            {/* Personal Records */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏅 Personal Records</Text>
              <View style={styles.recordCard}>
                <Icon name="trending-up" size={24} color="#FFD700" />
                <View style={styles.recordContent}>
                  <Text style={styles.recordLabel}>Longest Streak</Text>
                  <Text style={styles.recordValue}>
                    {stats.longestStreak} days
                  </Text>
                </View>
              </View>
              <View style={styles.recordCard}>
                <Icon name="timer" size={24} color="#FFD700" />
                <View style={styles.recordContent}>
                  <Text style={styles.recordLabel}>Longest Workout</Text>
                  <Text style={styles.recordValue}>
                    {stats.longestSingleWorkout} min
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* POSE TAB */}
        {activeTab === "pose" && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Icon name="accessibility" size={32} color="#667eea" />
                <Text style={styles.statValue}>{poseStatsData.sessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="schedule" size={32} color="#4CAF50" />
                <Text style={styles.statValue}>
                  {formatTime(Math.floor(poseStatsData.totalTime / 60))}
                </Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="check-circle" size={32} color="#FF6B4A" />
                <Text style={styles.statValue}>
                  {poseStatsData.completedDrills.length}
                </Text>
                <Text style={styles.statLabel}>Drills</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="trending-up" size={32} color="#FF5722" />
                <Text style={styles.statValue}>{calculatePoseAccuracy()}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>

            {/* Next Badge Progress */}
            {poseNextBadge && (
              <View style={styles.nextBadgeContainer}>
                <Text style={styles.sectionTitle}>🎯 Next Badge</Text>
                <BadgeProgressCard
                  badge={poseNextBadge}
                  progress={badgeProgress[poseNextBadge.id]}
                  isNext={true}
                />
              </View>
            )}

            {/* Completed Drills */}
            {poseStatsData.completedDrills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ Completed Drills</Text>
                {poseStatsData.completedDrills.map((drillId, idx) => {
                  const drillScores = poseStatsData.scores[drillId] || [];
                  const bestScore =
                    drillScores.length > 0 ? Math.max(...drillScores) : 0;
                  return (
                    <View key={idx} style={styles.recordCard}>
                      <Icon name="check-circle" size={24} color="#4CAF50" />
                      <View style={styles.recordContent}>
                        <Text style={styles.recordLabel}>{drillId}</Text>
                        <Text style={styles.recordValue}>
                          Best: {bestScore.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {poseStatsData.completedDrills.length === 0 && (
              <View style={styles.section}>
                <Text style={styles.emptyText}>
                  No pose practice sessions yet. Start practicing!
                </Text>
              </View>
            )}
          </>
        )}

        {/* AR TAB */}
        {activeTab === "ar" && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Icon name="view-in-ar" size={32} color="#667eea" />
                <Text style={styles.statValue}>{arStatsData.sessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="schedule" size={32} color="#4CAF50" />
                <Text style={styles.statValue}>
                  {formatTime(Math.floor(arStatsData.totalTime / 60))}
                </Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="explore" size={32} color="#FF6B4A" />
                <Text style={styles.statValue}>
                  {arStatsData.completedModules.length}
                </Text>
                <Text style={styles.statLabel}>Modules</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="star" size={32} color="#FF5722" />
                <Text style={styles.statValue}>
                  {arFormatted.accuracy || "0%"}
                </Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>

            {/* Next Badge Progress */}
            {arNextBadge && (
              <View style={styles.nextBadgeContainer}>
                <Text style={styles.sectionTitle}>🎯 Next Badge</Text>
                <BadgeProgressCard
                  badge={arNextBadge}
                  progress={badgeProgress[arNextBadge.id]}
                  isNext={true}
                />
              </View>
            )}

            {/* Completed Modules */}
            {arStatsData.completedModules.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ Completed Modules</Text>
                {arStatsData.completedModules.map((moduleId, idx) => (
                  <View key={idx} style={styles.recordCard}>
                    <Icon name="check-circle" size={24} color="#4CAF50" />
                    <View style={styles.recordContent}>
                      <Text style={styles.recordLabel}>{moduleId}</Text>
                      <Text style={styles.recordValue}>Completed</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {arStatsData.completedModules.length === 0 && (
              <View style={styles.section}>
                <Text style={styles.emptyText}>
                  No AR sessions yet. Start exploring!
                </Text>
              </View>
            )}
          </>
        )}

        {/* BADGES TAB - Show all badges */}
        {activeTab === "badges" && (
          <>
            <View style={styles.badgeSummary}>
              <Text style={styles.badgeSummaryText}>
                🏆{" "}
                {earnedBadges.length +
                  poseEarnedBadges.length +
                  arEarnedBadges.length}{" "}
                Total Badges Earned
              </Text>
            </View>

            {/* Cardio Badges */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💪 Cardio Badges</Text>
              {["bronze", "silver", "gold", "platinum", "diamond"].map(
                (tier) => {
                  const tierBadges = getBadgesByCategory("cardio").filter(
                    (b) => b.tier === tier
                  );
                  const earnedInTier = tierBadges.filter((b) =>
                    earnedBadges.includes(b.id)
                  );

                  if (tierBadges.length === 0) return null;

                  return (
                    <View key={tier} style={styles.tierSection}>
                      <Text style={styles.tierTitle}>
                        {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier (
                        {earnedInTier.length}/{tierBadges.length})
                      </Text>
                      {tierBadges.map((badge) => (
                        <BadgeProgressCard
                          key={badge.id}
                          badge={badge}
                          progress={badgeProgress[badge.id]}
                          isEarned={earnedBadges.includes(badge.id)}
                        />
                      ))}
                    </View>
                  );
                }
              )}
            </View>

            {/* Pose Badges */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🧘 Pose Estimation Badges</Text>
              {["bronze", "silver", "gold", "platinum", "diamond"].map(
                (tier) => {
                  const tierBadges = getBadgesByCategory(
                    "poseEstimation"
                  ).filter((b) => b.tier === tier);
                  const earnedInTier = tierBadges.filter((b) =>
                    poseEarnedBadges.includes(b.id)
                  );

                  if (tierBadges.length === 0) return null;

                  return (
                    <View key={tier} style={styles.tierSection}>
                      <Text style={styles.tierTitle}>
                        {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier (
                        {earnedInTier.length}/{tierBadges.length})
                      </Text>
                      {tierBadges.map((badge) => (
                        <BadgeProgressCard
                          key={badge.id}
                          badge={badge}
                          progress={badgeProgress[badge.id]}
                          isEarned={poseEarnedBadges.includes(badge.id)}
                        />
                      ))}
                    </View>
                  );
                }
              )}
            </View>

            {/* AR Badges */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🥽 AR Badges</Text>
              {["bronze", "silver", "gold", "platinum", "diamond"].map(
                (tier) => {
                  const tierBadges = getBadgesByCategory("ar").filter(
                    (b) => b.tier === tier
                  );
                  const earnedInTier = tierBadges.filter((b) =>
                    arEarnedBadges.includes(b.id)
                  );

                  if (tierBadges.length === 0) return null;

                  return (
                    <View key={tier} style={styles.tierSection}>
                      <Text style={styles.tierTitle}>
                        {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier (
                        {earnedInTier.length}/{tierBadges.length})
                      </Text>
                      {tierBadges.map((badge) => (
                        <BadgeProgressCard
                          key={badge.id}
                          badge={badge}
                          progress={badgeProgress[badge.id]}
                          isEarned={arEarnedBadges.includes(badge.id)}
                        />
                      ))}
                    </View>
                  );
                }
              )}
            </View>
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Cardio Workouts</Text>
            {cardioWorkouts.length === 0 ? (
              <Text style={styles.emptyText}>
                No workouts yet. Start your first workout!
              </Text>
            ) : (
              cardioWorkouts
                .slice(-10)
                .reverse()
                .map((workout, index) => (
                  <View key={index} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyDate}>
                        {new Date(workout.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                      <View
                        style={[
                          styles.completionBadge,
                          {
                            backgroundColor:
                              workout.completionRate >= 80
                                ? "#4CAF50"
                                : workout.completionRate >= 50
                                ? "#FF9500"
                                : "#FF3B30",
                          },
                        ]}
                      >
                        <Text style={styles.completionText}>
                          {workout.completionRate}%
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historyPlan}>{workout.planName}</Text>
                    <View style={styles.historyStats}>
                      <Text style={styles.historyStatItem}>
                        <Icon name="schedule" size={14} color="#666" />{" "}
                        {workout.totalDurationActual || 0}min
                      </Text>
                      <Text style={styles.historyStatItem}>
                        <Icon name="check-circle" size={14} color="#4CAF50" />{" "}
                        {workout.activitiesCompleted}
                      </Text>
                      <Text style={styles.historyStatItem}>
                        <Icon name="cancel" size={14} color="#FF3B30" />{" "}
                        {workout.activitiesSkipped}
                      </Text>
                    </View>
                  </View>
                ))
            )}
          </View>
        )}
      </ScrollView>
    </View></View>
  );
}

// Badge Progress Card Component
/**
 * @param {{badge: Badge, progress?: {currentValue: number, percentComplete: number}, isEarned?: boolean, isNext?: boolean}} props
 */
function BadgeProgressCard({
  badge,
  progress,
  isEarned = false,
  isNext = false,
}) {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (progress) {
      Animated.timing(progressAnim, {
        toValue: progress.percentComplete / 100,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={[
        styles.badgeCard,
        isEarned && styles.badgeCardEarned,
        isNext && styles.badgeCardNext,
      ]}
    >
      <View style={styles.badgeIcon}>
        <Icon
          name={badge.icon}
          size={isNext ? 48 : 32}
          color={isEarned ? badge.color : "#ccc"}
        />
      </View>
      <View style={styles.badgeInfo}>
        <Text style={[styles.badgeName, isEarned && styles.badgeNameEarned]}>
          {badge.name} {isEarned && "✓"}
        </Text>
        <Text style={styles.badgeDescription}>{badge.description}</Text>

        {!isEarned && progress && (
          <>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressWidth,
                    backgroundColor: getTierColor(badge.tier),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.currentValue} / {badge.requirement}{" "}
              {badge.requirementUnit}({Math.round(progress.percentComplete)}%)
            </Text>
          </>
        )}

        {isEarned && <Text style={styles.earnedText}>🎉 Earned!</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  backButtonContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 1000,
    backgroundColor: "rgba(65, 105, 225, 0.9)",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#4169E1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20 },
  title: { fontSize: 32, fontWeight: "bold", color: "#333", marginBottom: 20 },

  tabsScrollContent: {
    paddingBottom: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    minWidth: "100%",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
    minWidth: 80,
  },
  tabActive: { backgroundColor: '#4169E1' },
  tabText: { fontSize: 13, fontWeight: "600", color: "#666" },
  tabTextActive: { color: "#fff" },

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: { fontSize: 28, fontWeight: "bold", color: "#333", marginTop: 8 },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4 },

  nextBadgeContainer: { marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },

  badgeSummary: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  badgeSummaryText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },

  tierSection: { marginBottom: 24 },
  tierTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },

  badgeCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeCardEarned: { borderWidth: 2, borderColor: "#4CAF50" },
  badgeCardNext: {
    backgroundColor: "#E3F2FD",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  badgeIcon: { marginRight: 16, justifyContent: "center" },
  badgeInfo: { flex: 1 },
  badgeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  badgeNameEarned: { color: "#4CAF50" },
  badgeDescription: { fontSize: 14, color: "#666", marginBottom: 8 },

  progressBarContainer: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 12, color: "#666" },
  earnedText: { fontSize: 14, color: "#4CAF50", fontWeight: "600" },

  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recordContent: { marginLeft: 16, flex: 1 },
  recordLabel: { fontSize: 14, color: "#666", marginBottom: 4 },
  recordValue: { fontSize: 20, fontWeight: "bold", color: "#333" },

  historyCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDate: { fontSize: 14, color: "#666", fontWeight: "600" },
  completionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completionText: { fontSize: 12, color: "#fff", fontWeight: "bold" },
  historyPlan: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  historyStats: { flexDirection: "row", gap: 16 },
  historyStatItem: { fontSize: 12, color: "#666" },

  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
});
