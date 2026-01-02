import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AdaptiveAdjustments } from '../utils/adaptiveProgress.js';

/**
 * @typedef {Object} WorkoutPlan
 * @property {string} [planName]
 * @property {string} [skillLevel]
 * @property {string} [goal]
 * @property {string|string[]} [exercises]
 * @property {number} [durationMinutes]
 * @property {string} [equipment]
 */

/**
 * @typedef {Object} PlanExplanationModalProps
 * @property {boolean} visible
 * @property {WorkoutPlan} plan
 * @property {CardioProfile|null} quizAnswers
 * @property {AdaptiveAdjustments} [adaptiveAdjustments]
 * @property {() => void} onClose
 */

/**
 * @param {number} [height]
 * @param {number} [weight]
 * @returns {string}
 */
function getBMICategory(height, weight) {
  if (!height || !weight) return 'Not provided';
  const bmi = weight / Math.pow(height / 100, 2);
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * @param {string} category
 * @returns {string}
 */
function getBMIEmoji(category) {
  switch (category) {
    case 'Underweight': return '📉';
    case 'Normal': return '✅';
    case 'Overweight': return '📈';
    case 'Obese': return '⚠️';
    default: return '❓';
  }
}

/**
 * @param {PlanExplanationModalProps} props
 */
export default function PlanExplanationModal({
  visible,
  plan,
  quizAnswers,
  adaptiveAdjustments,
  onClose,
}) {
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  if (!quizAnswers) return null;

  const bmiCategory = getBMICategory(quizAnswers.height, quizAnswers.weight);
  const bmiValue = quizAnswers.height && quizAnswers.weight
    ? (quizAnswers.weight / Math.pow(quizAnswers.height / 100, 2)).toFixed(1)
    : 'N/A';

  const exerciseCount = typeof plan.exercises === 'string'
    ? plan.exercises.split(';').length
    : Array.isArray(plan.exercises)
    ? plan.exercises.length
    : 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>🎯 Plan Insights</Text>
              <Text style={styles.modalSubtitle}>How we personalized this for you</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Your Profile Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Your Profile</Text>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                  <Icon name="fitness-center" size={24} color="#007AFF" />
                  <Text style={styles.infoLabel}>Fitness Level</Text>
                  <Text style={styles.infoValue}>{quizAnswers.fitnessLevel}</Text>
                </View>

                <View style={styles.infoCard}>
                  <Icon name="flag" size={24} color="#4CAF50" />
                  <Text style={styles.infoLabel}>Goal</Text>
                  <Text style={styles.infoValue}>{quizAnswers.goal}</Text>
                </View>

                <View style={styles.infoCard}>
                  <Icon name="timer" size={24} color="#FF9500" />
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{quizAnswers.trainingDuration}</Text>
                </View>

                {quizAnswers.equipment && (
                  <View style={styles.infoCard}>
                    <Icon name="build" size={24} color="#9C27B0" />
                    <Text style={styles.infoLabel}>Equipment</Text>
                    <Text style={styles.infoValue}>{quizAnswers.equipment}</Text>
                  </View>
                )}
              </View>

              {/* BMI Info */}
              {quizAnswers.height && quizAnswers.weight && (
                <View style={styles.bmiCard}>
                  <View style={styles.bmiHeader}>
                    <Text style={styles.bmiEmoji}>{getBMIEmoji(bmiCategory)}</Text>
                    <View>
                      <Text style={styles.bmiLabel}>BMI Category</Text>
                      <Text style={styles.bmiValue}>{bmiCategory}</Text>
                    </View>
                    <Text style={styles.bmiNumber}>{bmiValue}</Text>
                  </View>
                  <Text style={styles.bmiNote}>
                    {bmiCategory === 'Overweight' || bmiCategory === 'Obese'
                      ? '💡 We added extra rest periods to support your fitness journey'
                      : bmiCategory === 'Underweight'
                      ? '💡 We slightly increased rest to help you build strength safely'
                      : '💡 Your plan is optimized for your current fitness level'}
                  </Text>
                </View>
              )}

              {/* Limitations */}
              {quizAnswers.limitations && quizAnswers.limitations.length > 0 && 
               !quizAnswers.limitations.includes('None') && (
                <View style={styles.limitationsCard}>
                  <View style={styles.limitationsHeader}>
                    <Icon name="warning" size={24} color="#FF6B4A" />
                    <Text style={styles.limitationsTitle}>Physical Limitations</Text>
                  </View>
                  <View style={styles.limitationsList}>
                    {quizAnswers.limitations.filter(l => l !== 'None').map((limitation, idx) => (
                      <View key={idx} style={styles.limitationChip}>
                        <Icon name="block" size={16} color="#FF6B4A" />
                        <Text style={styles.limitationText}>{limitation}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.limitationsNote}>
                    ✓ Exercises that could aggravate these conditions have been filtered out
                  </Text>
                </View>
              )}
            </View>

            {/* Adaptive Adjustments */}
            {adaptiveAdjustments && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧠 Smart Adjustments</Text>
                
                {adaptiveAdjustments.recommendation && (
                  <View style={styles.recommendationCard}>
                    <Icon name="lightbulb" size={24} color="#FFC107" />
                    <Text style={styles.recommendationText}>
                      {adaptiveAdjustments.recommendation}
                    </Text>
                  </View>
                )}

                <View style={styles.adjustmentsGrid}>
                  {adaptiveAdjustments.restMultiplierAdjustment !== 0 && (
                    <View style={styles.adjustmentCard}>
                      <Icon 
                        name={adaptiveAdjustments.restMultiplierAdjustment > 0 ? "timer" : "speed"} 
                        size={20} 
                        color={adaptiveAdjustments.restMultiplierAdjustment > 0 ? "#FF9500" : "#4CAF50"} 
                      />
                      <Text style={styles.adjustmentLabel}>Rest Time</Text>
                      <Text style={styles.adjustmentValue}>
                        {adaptiveAdjustments.restMultiplierAdjustment > 0 ? '+' : ''}
                        {(adaptiveAdjustments.restMultiplierAdjustment * 100).toFixed(0)}%
                      </Text>
                    </View>
                  )}

                  {adaptiveAdjustments.setsAdjustment !== 0 && (
                    <View style={styles.adjustmentCard}>
                      <Icon 
                        name={adaptiveAdjustments.setsAdjustment > 0 ? "trending-up" : "trending-down"} 
                        size={20} 
                        color={adaptiveAdjustments.setsAdjustment > 0 ? "#4CAF50" : "#FF9500"} 
                      />
                      <Text style={styles.adjustmentLabel}>Sets</Text>
                      <Text style={styles.adjustmentValue}>
                        {adaptiveAdjustments.setsAdjustment > 0 ? '+' : ''}
                        {adaptiveAdjustments.setsAdjustment}
                      </Text>
                    </View>
                  )}

                  {adaptiveAdjustments.exerciseDifficultyAdjustment !== 'same' && (
                    <View style={styles.adjustmentCard}>
                      <Icon 
                        name={adaptiveAdjustments.exerciseDifficultyAdjustment === 'harder' ? "arrow-upward" : "arrow-downward"} 
                        size={20} 
                        color={adaptiveAdjustments.exerciseDifficultyAdjustment === 'harder' ? "#4CAF50" : "#FF9500"} 
                      />
                      <Text style={styles.adjustmentLabel}>Difficulty</Text>
                      <Text style={styles.adjustmentValue}>
                        {adaptiveAdjustments.exerciseDifficultyAdjustment === 'harder' ? 'Harder' : 'Easier'}
                      </Text>
                    </View>
                  )}
                </View>

                {adaptiveAdjustments.plateauDetected && (
                  <View style={styles.alertCard}>
                    <Icon name="sync" size={20} color="#FF9500" />
                    <Text style={styles.alertText}>
                      Plateau detected - we've mixed things up to keep you progressing!
                    </Text>
                  </View>
                )}

                {adaptiveAdjustments.restDayRecommended && (
                  <View style={styles.alertCard}>
                    <Icon name="hotel" size={20} color="#2196F3" />
                    <Text style={styles.alertText}>
                      Consider a rest day - recovery is part of progress!
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Plan Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Plan Overview</Text>
              <View style={styles.overviewCard}>
                <View style={styles.overviewRow}>
                  <Icon name="fitness-center" size={20} color="#007AFF" />
                  <Text style={styles.overviewLabel}>Activities</Text>
                  <Text style={styles.overviewValue}>{exerciseCount}</Text>
                </View>
                <View style={styles.overviewRow}>
                  <Icon name="schedule" size={20} color="#4CAF50" />
                  <Text style={styles.overviewLabel}>Duration</Text>
                  <Text style={styles.overviewValue}>{plan.durationMinutes || 30} min</Text>
                </View>
                {plan.equipment && plan.equipment !== 'None' && (
                  <View style={styles.overviewRow}>
                    <Icon name="build" size={20} color="#9C27B0" />
                    <Text style={styles.overviewLabel}>Equipment</Text>
                    <Text style={styles.overviewValue}>{plan.equipment}</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Text style={styles.closeModalButtonText}>Got it! Let's go 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  modalSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  closeButton: { padding: 4 },
  modalContent: { padding: 20 },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  infoCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, alignItems: 'center', flex: 1, minWidth: '45%' },
  infoLabel: { fontSize: 12, color: '#666', marginTop: 8 },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 4, textAlign: 'center' },
  
  bmiCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, marginBottom: 16 },
  bmiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bmiEmoji: { fontSize: 32, marginRight: 12 },
  bmiLabel: { fontSize: 12, color: '#666' },
  bmiValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  bmiNumber: { fontSize: 24, fontWeight: 'bold', color: '#007AFF', marginLeft: 'auto' },
  bmiNote: { fontSize: 14, color: '#666', lineHeight: 20 },
  
  limitationsCard: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 16 },
  limitationsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  limitationsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  limitationsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  limitationChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  limitationText: { fontSize: 12, color: '#333' },
  limitationsNote: { fontSize: 12, color: '#666', marginTop: 8 },
  
  recommendationCard: { flexDirection: 'row', backgroundColor: '#FFF9C4', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center' },
  recommendationText: { fontSize: 14, color: '#333', marginLeft: 12, flex: 1, lineHeight: 20 },
  
  adjustmentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  adjustmentCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, alignItems: 'center', flex: 1, minWidth: '30%' },
  adjustmentLabel: { fontSize: 12, color: '#666', marginTop: 8 },
  adjustmentValue: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 4 },
  
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', borderRadius: 12, padding: 12, marginBottom: 8 },
  alertText: { fontSize: 14, color: '#333', marginLeft: 12, flex: 1 },
  
  overviewCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16 },
  overviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  overviewLabel: { fontSize: 14, color: '#666', marginLeft: 12, flex: 1 },
  overviewValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  
  closeModalButton: { backgroundColor: '#007AFF', marginHorizontal: 20, marginBottom: 20, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  closeModalButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

