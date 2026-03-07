import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  StatusBar,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useSurfTutorProfile } from '../context/SurfTutorProfileContext.jsx';
import { userAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');

/**
 * @typedef {Object} SurfTutorQuizScreenProps
 * @property {() => void} onComplete
 */

/**
 * Unified Surf Tutor Quiz Screen
 * Combines questions from both Cardio and AR quizzes
 * @param {SurfTutorQuizScreenProps} props
 */
export default function SurfTutorQuizScreen({ onComplete }) {
  const router = useRouter();
  const { saveProfile } = useSurfTutorProfile();
  const { refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  // Quiz state
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [trainingDuration, setTrainingDuration] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [equipment, setEquipment] = useState('');
  const [limitations, setLimitations] = useState([]);

  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const steps = [
    { id: 0, title: 'Fitness', question: 'What is your current fitness level?', icon: 'trending-up' },
    { id: 1, title: 'Experience', question: 'What is your surfing experience level?', icon: 'surfing' },
    { id: 2, title: 'Goal', question: 'What is your main training goal?', icon: 'flag' },
    { id: 3, title: 'Duration', question: 'How long can you train per session?', icon: 'schedule' },
    { id: 4, title: 'Body Info', question: 'Tell us about yourself', icon: 'person' },
    { id: 5, title: 'Equipment', question: 'What equipment do you have access to?', icon: 'fitness-center' },
    { id: 6, title: 'Limitations', question: 'Any physical limitations or injuries?', icon: 'health-and-safety' },
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

  // Option configurations
  const fitnessLevels = [
    { value: 'Beginner', icon: 'star-outline', color: '#4CAF50', description: 'Just starting out' },
    { value: 'Intermediate', icon: 'star-half', color: '#FF9800', description: 'Regular training' },
    { value: 'Pro', icon: 'star', color: '#F44336', description: 'Advanced athlete' },
  ];

  const experienceLevels = [
    { value: 'Beginner', icon: 'waves', color: '#4CAF50', description: 'New to surfing' },
    { value: 'Intermediate', icon: 'surfing', color: '#FF9800', description: 'Comfortable on waves' },
    { value: 'Advanced', icon: 'emoji-events', color: '#F44336', description: 'Experienced surfer' },
  ];

  const goals = [
    { value: 'Warm up only', icon: 'wb-sunny', description: 'Light pre-surf warm-up' },
    { value: 'Improve endurance', icon: 'directions-run', description: 'Build stamina for longer sessions' },
    { value: 'Improve explosive pop-up speed', icon: 'flash-on', description: 'Faster transitions to standing' },
  ];

  const durations = [
    { value: '5-10 minutes', icon: 'timer', description: 'Quick session' },
    { value: '10-20 minutes', icon: 'timer', description: 'Moderate workout' },
    { value: '20+ minutes', icon: 'timer', description: 'Extended training' },
  ];

  const genderOptions = [
    { value: 'Male', icon: 'male' },
    { value: 'Female', icon: 'female' },
  ];

  const equipmentOptions = [
    { value: 'None', icon: 'accessibility', description: 'Bodyweight only' },
    { value: 'Kettlebell', icon: 'fitness-center', description: 'Kettlebell available' },
    { value: 'Gym', icon: 'home', description: 'Full gym access' },
  ];

  const limitationOptions = [
    'None', 'Knee discomfort', 'Knee injury', 'Lower back tightness', 'Lower back pain',
    'Upper back pain', 'Shoulder injury', 'Shoulder pain', 'Rotator cuff issues',
    'Ankle injury', 'Ankle pain', 'Ankle instability', 'Wrist injury', 'Wrist pain',
    'Carpal tunnel', 'Hip discomfort', 'Hip pain', 'Hip injury', 'Neck pain',
    'Neck injury', 'Elbow pain', 'Tennis elbow', 'Golfer\'s elbow', 'Asthma',
    'Breathing difficulties', 'Heart conditions', 'High blood pressure',
  ];

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
    // Validation for each step
    if (currentStep === 0 && !fitnessLevel) {
      Alert.alert('Required', 'Please select your fitness level');
      return;
    }
    if (currentStep === 1 && !experienceLevel) {
      Alert.alert('Required', 'Please select your surfing experience level');
      return;
    }
    if (currentStep === 2 && !goal) {
      Alert.alert('Required', 'Please select your training goal');
      return;
    }
    if (currentStep === 3 && !trainingDuration) {
      Alert.alert('Required', 'Please select training duration');
      return;
    }
    if (currentStep === 4) {
      // Validate body info
      if (!height || !weight || !age || !gender) {
        Alert.alert('Required', 'Please fill in all body information fields');
        return;
      }
      const h = parseFloat(height);
      const w = parseFloat(weight);
      const a = parseInt(age);
      if (isNaN(h) || h < 100 || h > 250) {
        Alert.alert('Invalid Height', 'Please enter height between 100-250 cm');
        return;
      }
      if (isNaN(w) || w < 30 || w > 200) {
        Alert.alert('Invalid Weight', 'Please enter weight between 30-200 kg');
        return;
      }
      if (isNaN(a) || a < 10 || a > 100) {
        Alert.alert('Invalid Age', 'Please enter age between 10-100 years');
        return;
      }
    }
    if (currentStep === 5 && !equipment) {
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
      const heightInMeters = parseFloat(height) / 100; // Convert cm to meters
      const weightInKg = parseFloat(weight);
      const bmi = weightInKg / (heightInMeters * heightInMeters);

      const profile = {
        fitnessLevel,
        experienceLevel,
        goal,
        trainingDuration,
        height: parseFloat(height),
        weight: weightInKg,
        age: parseInt(age),
        gender,
        equipment: equipment || 'None',
        limitations: limitations && limitations.length > 0 ? limitations.join(', ') : '',
        bmi: parseFloat(bmi.toFixed(2)),
        completed: true,
        completedAt: new Date().toISOString(),
      };

      // Save to local storage
      await saveProfile(profile);

      // Save to user profile in database
      try {
        await userAPI.updateProfile({
          aiSurfTutor: profile,
        });
        // Refresh user data to get updated profile
        await refreshUser();
      } catch (apiError) {
        console.error('Failed to save to user profile:', apiError);
        // Continue even if API fails - we have local storage
      }

      onComplete();
    } catch (error) {
      console.error('Quiz submit error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Fitness Level
        return (
          <View style={styles.optionsContainer}>
            {fitnessLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.optionCard,
                  fitnessLevel === level.value && styles.optionCardSelected,
                ]}
                onPress={() => setFitnessLevel(level.value)}
              >
                <Icon name={level.icon} size={36} color={level.color} />
                <Text style={styles.optionTitle}>{level.value}</Text>
                <Text style={styles.optionDescription}>{level.description}</Text>
                {fitnessLevel === level.value && (
                  <View style={styles.checkBadge}>
                    <Icon name="check" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 1: // Surfing Experience
        return (
          <View style={styles.optionsContainer}>
            {experienceLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.optionCard,
                  experienceLevel === level.value && styles.optionCardSelected,
                ]}
                onPress={() => setExperienceLevel(level.value)}
              >
                <Icon name={level.icon} size={36} color={level.color} />
                <Text style={styles.optionTitle}>{level.value}</Text>
                <Text style={styles.optionDescription}>{level.description}</Text>
                {experienceLevel === level.value && (
                  <View style={styles.checkBadge}>
                    <Icon name="check" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 2: // Goal
        return (
          <View style={styles.optionsContainer}>
            {goals.map((goalItem) => (
              <TouchableOpacity
                key={goalItem.value}
                style={[
                  styles.optionCard,
                  goal === goalItem.value && styles.optionCardSelected,
                ]}
                onPress={() => setGoal(goalItem.value)}
              >
                <Icon name={goalItem.icon} size={36} color="#2563eb" />
                <Text style={styles.optionTitle}>{goalItem.value}</Text>
                <Text style={styles.optionDescription}>{goalItem.description}</Text>
                {goal === goalItem.value && (
                  <View style={styles.checkBadge}>
                    <Icon name="check" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 3: // Training Duration
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
                <Icon name={duration.icon} size={36} color="#2563eb" />
                <Text style={styles.optionTitle}>{duration.value}</Text>
                <Text style={styles.optionDescription}>{duration.description}</Text>
                {trainingDuration === duration.value && (
                  <View style={styles.checkBadge}>
                    <Icon name="check" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 4: // Body Info
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputCard}>
              <Icon name="height" size={28} color="#2563eb" />
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 175"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputCard}>
              <Icon name="monitor-weight" size={28} color="#2563eb" />
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 70"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputCard}>
              <Icon name="cake" size={28} color="#2563eb" />
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age (years)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 25"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.genderContainer}>
              <Text style={styles.genderLabel}>Gender</Text>
              <View style={styles.genderButtons}>
                {genderOptions.map((genderOption) => (
                  <TouchableOpacity
                    key={genderOption.value}
                    style={[
                      styles.genderButton,
                      gender === genderOption.value && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender(genderOption.value)}
                  >
                    <Icon
                      name={genderOption.icon}
                      size={20}
                      color={gender === genderOption.value ? '#fff' : '#6b7280'}
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === genderOption.value && styles.genderButtonTextActive,
                      ]}
                    >
                      {genderOption.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 5: // Equipment
        return (
          <View style={styles.optionsContainer}>
            {equipmentOptions.map((equip) => (
              <TouchableOpacity
                key={equip.value}
                style={[
                  styles.optionCard,
                  equipment === equip.value && styles.optionCardSelected,
                ]}
                onPress={() => setEquipment(equip.value)}
              >
                <Icon name={equip.icon} size={36} color="#2563eb" />
                <Text style={styles.optionTitle}>{equip.value}</Text>
                <Text style={styles.optionDescription}>{equip.description}</Text>
                {equipment === equip.value && (
                  <View style={styles.checkBadge}>
                    <Icon name="check" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 6: // Limitations
        return (
          <View style={styles.limitationsContainer}>
            <View style={styles.limitationsGrid}>
              {limitationOptions.map((limitation) => (
                <TouchableOpacity
                  key={limitation}
                  style={[
                    styles.limitationChip,
                    limitations.includes(limitation) && styles.limitationChipSelected,
                  ]}
                  onPress={() => toggleLimitation(limitation)}
                >
                  <Text
                    style={[
                      styles.limitationText,
                      limitations.includes(limitation) && styles.limitationTextSelected,
                    ]}
                  >
                    {limitation}
                  </Text>
                  {limitations.includes(limitation) && (
                    <Icon name="check-circle" size={16} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.infoBox}>
              <Icon name="info-outline" size={18} color="#1976D2" />
              <Text style={styles.infoText}>
                Select all that apply. This helps us create safer, more effective workouts for you.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

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
          <View className="flex-row items-center mb-3">
            <TouchableOpacity
              className="mr-4 w-9 h-9 rounded-full bg-white/20 items-center justify-center"
              onPress={handleBack}
            >
              <Icon name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">Surf Tutor Setup</Text>
              <Text className="text-blue-100 text-sm">Step {currentStep + 1} of {steps.length}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mb-3">
            <View className="h-1 bg-white/30 rounded-full overflow-hidden">
              <Animated.View
                className="h-full bg-white rounded-full"
                style={{
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }}
              />
            </View>
            <Text className="text-white/90 text-xs mt-1 text-center font-semibold">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </Text>
          </View>

          {/* Question Section */}
          <View className="items-center pt-1">
            <View className="w-11 h-11 rounded-full bg-white/25 items-center justify-center mb-2">
              <Icon name={steps[currentStep].icon} size={24} color="#fff" />
            </View>
            <Text className="text-white text-base font-semibold text-center leading-5">
              {steps[currentStep].question}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content Area */}
      <View className="flex-1 bg-gray-50">
        <ScrollView 
          className="flex-1 px-6 py-6"
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
      </View>

      {/* Navigation */}
      <View className="px-6 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-4 items-center justify-center flex-row"
          onPress={handleNext}
          style={{
            shadowColor: '#2563eb',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text className="text-white text-base font-bold mr-2">
            {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
          </Text>
          <Icon name={currentStep === steps.length - 1 ? 'check' : 'arrow-forward'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: '#2563eb',
    borderWidth: 2,
    shadowOpacity: 0.15,
    elevation: 4,
    backgroundColor: '#eff6ff',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  inputContainer: {
    gap: 14,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    flex: 1,
    marginLeft: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e8eaf0',
  },
  genderContainer: {
    marginTop: 10,
  },
  genderLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  limitationsContainer: {
    gap: 16,
  },
  limitationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  limitationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#e8eaf0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 6,
  },
  limitationChipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    borderWidth: 2,
    shadowColor: '#2563eb',
    shadowOpacity: 0.15,
  },
  limitationText: {
    fontSize: 13,
    color: '#666',
  },
  limitationTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    flex: 1,
    lineHeight: 18,
  },
});
