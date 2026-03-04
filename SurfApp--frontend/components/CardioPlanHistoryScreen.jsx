import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import SafeLinearGradient from './SafeLinearGradient.jsx';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutExecutionScreen from './WorkoutExecutionScreen.jsx';

const { width } = Dimensions.get('window');
const PLAN_HISTORY_KEY = '@cardio_plan_history';

/**
 * @typedef {Object} SavedPlan
 * @property {string} id
 * @property {string} planName
 * @property {string[]} exercises
 * @property {number} durationMinutes
 * @property {string} skillLevel
 * @property {string} goal
 * @property {string} generatedAt
 * @property {{fitnessLevel: string, goal: string, duration: string, bmi: string, limitations: string[]}} [quizAnswers]
 */

// ✅ Animated Plan Card Component
/**
 * @param {any} props
 */
const AnimatedHistoryCard = ({ plan, index, onRepeat, onDelete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 80,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay: index * 80,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /**
   * @param {string} dateString
   * @returns {string}
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
      <View style={styles.planCardHeader}>
        <View style={styles.planIconContainer}>
          <SafeLinearGradient
            colors={['#4169E1', '#5B8DEF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.planIconGradient}
          >
            <Icon name="fitness-center" size={24} color="#fff" />
          </SafeLinearGradient>
        </View>
        
        <View style={styles.planInfo}>
          <Text style={styles.planName} numberOfLines={1}>
            {plan.planName}
          </Text>
          <Text style={styles.planDate}>{formatDate(plan.generatedAt)}</Text>
        </View>

        <TouchableOpacity style={styles.deleteIconButton} onPress={onDelete}>
          <Icon name="delete-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.planStats}>
        <View style={styles.statBox}>
          <Icon name="schedule" size={18} color="#4169E1" />
          <Text style={styles.statValue}>{plan.durationMinutes}</Text>
          <Text style={styles.statLabel}>minutes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Icon name="list" size={18} color="#4169E1" />
          <Text style={styles.statValue}>{plan.exercises.length}</Text>
          <Text style={styles.statLabel}>exercises</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Icon name="trending-up" size={18} color="#4169E1" />
          <Text style={styles.statValue}>{plan.skillLevel}</Text>
          <Text style={styles.statLabel}>level</Text>
        </View>
      </View>

      {plan.exercises.length > 0 && (
        <View style={styles.exercisesPreview}>
          <Text style={styles.exercisesTitle}>Exercises:</Text>
          {plan.exercises.slice(0, 3).map((exercise, idx) => {
            // Handle both string and object exercises from ML server
            const exerciseName = typeof exercise === 'object' && exercise !== null
              ? (exercise.name || exercise.exercise || String(exercise))
              : String(exercise || '');
            
            return (
              <View key={idx} style={styles.exerciseRow}>
                <View style={styles.exerciseDot} />
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {exerciseName}
                </Text>
              </View>
            );
          })}
          {plan.exercises.length > 3 && (
            <Text style={styles.moreExercises}>
              +{plan.exercises.length - 3} more
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.repeatButton} onPress={onRepeat}>
        <SafeLinearGradient
          colors={['#4169E1', '#5B8DEF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.repeatButtonGradient}
        >
          <Icon name="replay" size={20} color="#fff" />
          <Text style={styles.repeatButtonText}>Repeat Workout</Text>
        </SafeLinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function CardioPlanHistoryScreen() {
  const router = useRouter();
  const [savedPlans, setSavedPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Animations
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    loadPlanHistory();
  }, []);

  const loadPlanHistory = async () => {
    setRefreshing(true);
    try {
      const data = await AsyncStorage.getItem(PLAN_HISTORY_KEY);
      if (data) {
        const plans = JSON.parse(data);
        setSavedPlans(plans || []);
      }
    } catch (error) {
      console.error('Error loading plan history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * @param {SavedPlan} plan
   */
  const handleRepeatPlan = (plan) => {
    setSelectedPlan(plan);
  };

  /**
   * @param {string} planId
   */
  const handleDeletePlan = (planId) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = savedPlans.filter(p => p.id !== planId);
              await AsyncStorage.setItem(PLAN_HISTORY_KEY, JSON.stringify(updated));
              setSavedPlans(updated);
              
              // ✅ Animate deletion
              Alert.alert('Success', 'Plan deleted successfully');
            } catch (error) {
              console.error('Error deleting plan:', error);
              Alert.alert('Error', 'Failed to delete plan');
            }
          },
        },
      ]
    );
  };

  const handleClearAllPlans = () => {
    Alert.alert(
      'Clear All Plans',
      'Are you sure you want to delete ALL saved plans? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.setItem(PLAN_HISTORY_KEY, JSON.stringify([]));
              setSavedPlans([]);
              Alert.alert('Success', 'All plans cleared');
            } catch (error) {
              console.error('Error clearing plans:', error);
              Alert.alert('Error', 'Failed to clear plans');
            }
          },
        },
      ]
    );
  };

  if (selectedPlan) {
    return (
      <WorkoutExecutionScreen
        workoutPlan={{
          planName: selectedPlan.planName,
          skillLevel: selectedPlan.skillLevel,
          goal: selectedPlan.goal,
          exercises: selectedPlan.exercises,
          durationMinutes: selectedPlan.durationMinutes,
        }}
        onComplete={() => setSelectedPlan(null)}
      />
    );
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
              <Text className="text-white text-2xl font-bold">My Cardio Plans</Text>
              <Text className="text-blue-100 text-sm">
                {savedPlans.length} {savedPlans.length === 1 ? 'plan' : 'plans'} saved
              </Text>
            </View>
          </View>
          {savedPlans.length > 0 && (
            <TouchableOpacity onPress={handleClearAllPlans}>
              <Icon name="delete-sweep" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 bg-gray-50">
        <ScrollView 
          className="flex-1 px-6 py-6"
          showsVerticalScrollIndicator={false}
        >
        {savedPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <SafeLinearGradient
              colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyStateGradient}
            >
              <Icon name="history" size={80} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Plans Yet</Text>
              <Text style={styles.emptyStateText}>
                Your saved workout plans will appear here
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.back()}
              >
                <SafeLinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyStateButtonGradient}
                >
                  <Icon name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.emptyStateButtonText}>Create Your First Plan</Text>
                </SafeLinearGradient>
              </TouchableOpacity>
            </SafeLinearGradient>
          </View>
        ) : (
          savedPlans.map((plan, index) => (
            <AnimatedHistoryCard
              key={plan.id}
              plan={plan}
              index={index}
              onRepeat={() => handleRepeatPlan(plan)}
              onDelete={() => handleDeletePlan(plan.id)}
            />
          ))
        )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerSection: {
    marginBottom: 20,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  clearAllButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIconContainer: {
    marginRight: 12,
  },
  planIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  planDate: {
    fontSize: 13,
    color: '#999',
  },
  deleteIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planStats: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  exercisesPreview: {
    marginBottom: 16,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4169E1',
    marginRight: 10,
  },
  exerciseName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  moreExercises: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 16,
  },
  repeatButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  repeatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  repeatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    marginTop: 60,
  },
  emptyStateGradient: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  emptyStateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

