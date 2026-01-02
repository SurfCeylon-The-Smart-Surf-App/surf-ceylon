import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCardioProfile } from '../context/CardioProfileContext.jsx';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

/**
 * @typedef {Object} QuizStep
 * @property {number} id
 * @property {string} title
 * @property {string} question
 * @property {string} icon
 */

/**
 * @typedef {Object} CardioQuizScreenProps
 * @property {() => void} onComplete
 */

/**
 * @param {CardioQuizScreenProps} props
 */
export default function CardioQuizScreen({ onComplete }) {
  const router = useRouter();
  const { saveProfile } = useCardioProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [trainingDuration, setTrainingDuration] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [limitations, setLimitations] = useState([]);
  const [equipment, setEquipment] = useState('');

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const steps = [
    { id: 0, title: 'Fitness Level', question: 'What is your current fitness level?', icon: 'trending-up' },
    { id: 1, title: 'Goal', question: 'What is your main goal?', icon: 'flag' },
    { id: 2, title: 'Duration', question: 'How long can you train?', icon: 'schedule' },
    { id: 3, title: 'Body Info', question: 'Body measurements (optional)', icon: 'person' },
    { id: 4, title: 'Equipment', question: 'Available equipment?', icon: 'fitness-center' },
    { id: 5, title: 'Limitations', question: 'Physical limitations?', icon: 'health-and-safety' },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / steps.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const fitnessLevels = [
    { value: 'Beginner', icon: 'star-outline', color: '#4CAF50' },
    { value: 'Intermediate', icon: 'star-half', color: '#FF9800' },
    { value: 'Pro', icon: 'star', color: '#F44336' },
  ];

  const goals = [
    { value: 'Warm up only', icon: 'wb-sunny' },
    { value: 'Improve endurance', icon: 'directions-run' },
    { value: 'Improve explosive pop-up speed', icon: 'flash-on' },
  ];

  const durations = [
    { value: '5-10 minutes', icon: 'timer' },
    { value: '10-20 minutes', icon: 'timer' },
    { value: '20+ minutes', icon: 'timer' },
  ];

  const equipmentOptions = [
    { value: 'None', icon: 'accessibility' },
    { value: 'Kettlebell', icon: 'fitness-center' },
    { value: 'Gym', icon: 'home' },
  ];

  const limitationOptions = [
    'None', 'Knee discomfort', 'Knee injury', 'Lower back tightness', 'Lower back pain',
    'Upper back pain', 'Shoulder injury', 'Shoulder pain', 'Rotator cuff issues',
    'Ankle injury', 'Ankle pain', 'Ankle instability', 'Wrist injury', 'Wrist pain',
    'Carpal tunnel', 'Hip discomfort', 'Hip pain', 'Hip injury', 'Neck pain',
    'Neck injury', 'Elbow pain', 'Tennis elbow', 'Golfer\'s elbow', 'Asthma',
    'Breathing difficulties', 'Heart conditions', 'High blood pressure',
  ];

  /**
   * @param {string} limitation
   */
  const toggleLimitation = (limitation) => {
    if (limitation === 'None') {
      setLimitations(['None']);
    } else {
      setLimitations((prev) => {
        const filtered = prev.filter((l) => l !== 'None');
        if (filtered.includes(limitation)) {
          return filtered.filter((l) => l !== limitation);
        } else {
          return [...filtered, limitation];
        }
      });
    }
  };

  /**
   * @param {'forward'|'back'} direction
   */
  const animateTransition = (direction) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'forward' ? -width : width,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleNext = () => {
    if (currentStep === 0 && !fitnessLevel) {
      Alert.alert('Required', 'Please select your fitness level');
      return;
    }
    if (currentStep === 1 && !goal) {
      Alert.alert('Required', 'Please select your goal');
      return;
    }
    if (currentStep === 2 && !trainingDuration) {
      Alert.alert('Required', 'Please select training duration');
      return;
    }
    if (currentStep === 3) {
      if (height) {
        const h = parseFloat(height);
        if (isNaN(h) || h < 100 || h > 250) {
          Alert.alert('Invalid', 'Please enter a valid height (100-250 cm)');
          return;
        }
      }
      if (weight) {
        const w = parseFloat(weight);
        if (isNaN(w) || w < 30 || w > 200) {
          Alert.alert('Invalid', 'Please enter a valid weight (30-200 kg)');
          return;
        }
      }
    }
    if (currentStep === 4 && !equipment) {
      Alert.alert('Required', 'Please select your available equipment');
      return;
    }

    if (currentStep < steps.length - 1) {
      animateTransition('forward');
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateTransition('back');
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    try {
      const profile = {
        fitnessLevel,
        goal,
        trainingDuration,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        equipment: equipment || 'None',
        limitations: limitations.length > 0 ? limitations : undefined,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      await saveProfile(profile);
      onComplete();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.optionsContainer}>
            {fitnessLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.optionCard,
                  fitnessLevel === level.value && { borderColor: level.color, borderWidth: 3 },
                ]}
                onPress={() => setFitnessLevel(level.value)}
              >
                <Icon name={level.icon} size={36} color={level.color} />
                <Text style={styles.optionTitle}>{level.value}</Text>
                {fitnessLevel === level.value && (
                  <View style={[styles.checkBadge, { backgroundColor: level.color }]}>
                    <Icon name="check" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 1:
        return (
          <View style={styles.optionsContainer}>
            {goals.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[
                  styles.optionCard,
                  goal === g.value && styles.optionCardSelected,
                ]}
                onPress={() => setGoal(g.value)}
              >
                <Icon name={g.icon} size={36} color={goal === g.value ? '#667eea' : '#999'} />
                <Text style={styles.optionTitle}>{g.value}</Text>
                {goal === g.value && (
                  <View style={styles.checkBadge}>
                    <Icon name="check" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 2:
        return (
          <View style={styles.optionsContainer}>
            {durations.map((duration) => (
              <TouchableOpacity
                key={duration.value}
                style={[
                  styles.optionCard,
                  trainingDuration === duration.value && styles.optionCardSelected,
                ]}
                onPress={() => setTrainingDuration(duration.value)}
              >
                <Icon name={duration.icon} size={36} color={trainingDuration === duration.value ? '#667eea' : '#999'} />
                <Text style={styles.optionTitle}>{duration.value}</Text>
                {trainingDuration === duration.value && (
                  <View style={styles.checkBadge}>
                    <Icon name="check" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 3:
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputCard}>
              <Icon name="height" size={28} color="#667eea" />
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="e.g., 175"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.inputCard}>
              <Icon name="monitor-weight" size={28} color="#667eea" />
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g., 70"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Icon name="info-outline" size={18} color="#667eea" />
              <Text style={styles.infoText}>
                Optional: Helps calculate BMI for better recommendations
              </Text>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.optionsContainer}>
            {equipmentOptions.map((eq) => (
              <TouchableOpacity
                key={eq.value}
                style={[
                  styles.optionCard,
                  equipment === eq.value && styles.optionCardSelected,
                ]}
                onPress={() => setEquipment(eq.value)}
              >
                <Icon name={eq.icon} size={36} color={equipment === eq.value ? '#667eea' : '#999'} />
                <Text style={styles.optionTitle}>{eq.value}</Text>
                {equipment === eq.value && (
                  <View style={styles.checkBadge}>
                    <Icon name="check" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 5:
        return (
          <View style={styles.limitationsGrid}>
            {limitationOptions.map((limitation) => {
              const isSelected = limitations.includes(limitation);
              return (
                <TouchableOpacity
                  key={limitation}
                  style={[
                    styles.limitationChip,
                    isSelected && styles.limitationChipSelected,
                  ]}
                  onPress={() => toggleLimitation(limitation)}
                >
                  <Text style={[
                    styles.limitationText,
                    isSelected && styles.limitationTextSelected,
                  ]}>
                    {limitation}
                  </Text>
                  {isSelected && (
                    <Icon name="check-circle" size={16} color="#667eea" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ VERY COMPACT HEADER - Moved up */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.topBarContent}>
          <Text style={styles.topBarTitle}>Fitness Quiz</Text>
          <Text style={styles.topBarSubtitle}>Step {currentStep + 1}/{steps.length}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* ✅ VERY COMPACT PROGRESS BAR */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* ✅ COMPACT QUESTION */}
      <View style={styles.questionContainer}>
        <Icon name={steps[currentStep].icon} size={20} color="#667eea" />
        <Text style={styles.questionText}>{steps[currentStep].question}</Text>
      </View>

      {/* ✅ LARGE SCROLLABLE CONTENT AREA */}
      <ScrollView 
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
        >
          {renderStepContent()}
        </Animated.View>
      </ScrollView>

      {/* ✅ COMPACT NAVIGATION */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? 'Complete Quiz' : 'Next'}
            </Text>
            <Icon name={currentStep === steps.length - 1 ? 'check' : 'arrow-forward'} size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // ✅ TOP BAR - Very compact
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarContent: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  topBarSubtitle: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  
  // ✅ VERY COMPACT PROGRESS
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  
  // ✅ COMPACT QUESTION
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  
  // ✅ LARGE SCROLLABLE CONTENT
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Options
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#667eea',
    borderWidth: 3,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Inputs
  inputContainer: {
    gap: 12,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  inputGroup: {
    flex: 1,
    marginLeft: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  
  // Limitations
  limitationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  limitationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  limitationChipSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#667eea',
  },
  limitationText: {
    fontSize: 13,
    color: '#666',
    marginRight: 4,
  },
  limitationTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  
  // ✅ COMPACT NAVIGATION
  navigationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 6,
  },
});

