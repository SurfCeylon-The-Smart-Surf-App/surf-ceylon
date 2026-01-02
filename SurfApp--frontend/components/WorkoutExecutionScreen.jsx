import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  FlatList,
  Easing,
  Vibration,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExerciseData, getDefaultExerciseData, calculateCaloriesBurned } from '../utils/exerciseData.js';
import { generateWorkoutFeedback } from '../utils/workoutFeedback.js';
import { WorkoutProgress } from '../utils/adaptiveProgress.js';
import { formatTimeToMMSS } from '../utils/progressFormatter.js';

const WORKOUT_PROGRESS_KEY = '@workout_progress';

/**
 * @typedef {Object} WorkoutPlan
 * @property {string} [planName]
 * @property {string} [skillLevel]
 * @property {string} [goal]
 * @property {string|string[]} [exercises]
 * @property {number} [durationMinutes]
 */

/**
 * @typedef {Object} Activity
 * @property {string} name
 * @property {number} duration
 * @property {number} rest
 * @property {number} sets
 */

/**
 * @typedef {Object} ActivityProgress
 * @property {number} activityIndex
 * @property {string} activityName
 * @property {'not_started'|'ready'|'active'|'completed'|'skipped'|'paused'} status
 * @property {number} plannedDuration
 * @property {number} [actualDuration]
 * @property {number} setsPlanned
 * @property {number} [setsCompleted]
 * @property {number} [startTime]
 * @property {number} [endTime]
 * @property {number} [skippedAt]
 * @property {number} timeRemaining
 */

/**
 * @typedef {Object} WorkoutExecutionScreenProps
 * @property {WorkoutPlan} workoutPlan
 * @property {() => void} [onComplete]
 */

/** @type {'idle'|'countdown'|'ready'|'active'|'rest'|'completed'|'paused'} */
let WorkoutState;

/**
 * @param {WorkoutExecutionScreenProps} props
 */
export default function WorkoutExecutionScreen({ workoutPlan, onComplete }) {
  const router = useRouter();
  const [state, setState] = useState('idle');
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);
  const [activityProgresses, setActivityProgresses] = useState([]);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const activityStartTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const pausedDurationRef = useRef(0);
  const previousStateRef = useRef('idle');
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /**
   * @param {string|string[]|undefined} exercises
   * @returns {Activity[]}
   */
  const parseExercises = (exercises) => {
    if (!exercises) return [];
    
    const exerciseList = Array.isArray(exercises) 
      ? exercises 
      : (typeof exercises === 'string' ? exercises.split(';').map(e => e.trim()) : []);
    
    return exerciseList.map(ex => {
      const exerciseData = getExerciseData(ex) || getDefaultExerciseData(ex);
      return {
        name: exerciseData.name,
        duration: exerciseData.duration,
        rest: exerciseData.rest,
        sets: exerciseData.sets,
      };
    });
  };

  const activities = parseExercises(workoutPlan.exercises);
  const currentActivity = activities[currentActivityIndex];

  useEffect(() => {
    if (activities.length > 0 && activityProgresses.length === 0) {
      const initialProgresses = activities.map((activity, index) => ({
        activityIndex: index,
        activityName: activity.name,
        status: 'not_started',
        plannedDuration: activity.duration * activity.sets + activity.rest * (activity.sets - 1),
        setsPlanned: activity.sets,
        timeRemaining: activity.duration,
      }));
      setActivityProgresses(initialProgresses);
    }
  }, [activities]);

  useEffect(() => {
    if (state === 'active' || state === 'rest') {
      activityStartTimeRef.current = performance.now();
      const targetDuration = state === 'active' ? currentActivity.duration : currentActivity.rest;
      
      setActivityProgresses(prev => prev.map((prog, idx) => 
        idx === currentActivityIndex 
          ? { ...prog, status: state === 'active' ? 'active' : 'paused', startTime: Date.now() }
          : prog
      ));
      
      timerRef.current = setInterval(() => {
        const now = performance.now();
        const elapsed = (now - activityStartTimeRef.current) / 1000;
        const remaining = Math.max(0, targetDuration - elapsed);
        
        setTimeRemaining(Math.ceil(remaining));
        
        const totalElapsed = Math.floor((performance.now() - startTimeRef.current) / 1000);
        setTotalTimeElapsed(totalElapsed);
        
        setActivityProgresses(prev => prev.map((prog, idx) => 
          idx === currentActivityIndex 
            ? { ...prog, timeRemaining: Math.ceil(remaining) }
            : prog
        ));
        
        if (remaining <= 3 && remaining > 2.9) {
          Vibration.vibrate(100);
        } else if (remaining <= 2 && remaining > 1.9) {
          Vibration.vibrate(100);
        } else if (remaining <= 1 && remaining > 0.9) {
          Vibration.vibrate(100);
        }
        
        if (remaining <= 0) {
          Vibration.vibrate([0, 200, 100, 200]);
          handleTimeUp();
        }
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state, currentActivityIndex, currentSet]);

  useEffect(() => {
    if (state === 'active' && currentActivity) {
      const progress = 1 - (timeRemaining / currentActivity.duration);
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else if (state === 'rest' && currentActivity) {
      const progress = 1 - (timeRemaining / currentActivity.rest);
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  }, [timeRemaining, state]);

  useEffect(() => {
    if (state === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  const handleTimeUp = () => {
    if (state === 'active') {
      const caloriesBurned = calculateCaloriesBurned(currentActivity.name, currentActivity.duration, 1);
      setTotalCaloriesBurned(prev => prev + caloriesBurned);
      
      if (currentSet < currentActivity.sets) {
        setState('rest');
        setTimeRemaining(currentActivity.rest);
        setCurrentSet(currentSet + 1);
        
        setActivityProgresses(prev => prev.map((prog, idx) => 
          idx === currentActivityIndex 
            ? { ...prog, setsCompleted: currentSet }
            : prog
        ));
      } else {
        const completedTime = (performance.now() - activityStartTimeRef.current) / 1000;
        
        setActivityProgresses(prev => prev.map((prog, idx) => 
          idx === currentActivityIndex 
            ? { 
                ...prog, 
                status: 'completed',
                actualDuration: Math.floor(completedTime),
                setsCompleted: currentActivity.sets,
                endTime: Date.now()
              }
            : prog
        ));
        
        if (currentActivityIndex < activities.length - 1) {
          const nextIndex = currentActivityIndex + 1;
          setCurrentActivityIndex(nextIndex);
          setCurrentSet(1);
          setState('ready');
        } else {
          handleWorkoutComplete();
        }
      }
    } else if (state === 'rest') {
      setState('ready');
    }
  };

  const handleStart = () => {
    if (activities.length === 0) {
      Alert.alert('Error', 'No exercises in this workout plan');
      return;
    }
    startTimeRef.current = performance.now();
    setState('countdown');
    setTimeRemaining(3);
    
    const countdownStartTime = performance.now();
    const countdownTimer = setInterval(() => {
      const elapsed = (performance.now() - countdownStartTime) / 1000;
      const remaining = Math.max(0, 3 - elapsed);
      
      setTimeRemaining(Math.ceil(remaining));
      
      if (remaining <= 3 && remaining > 2) Vibration.vibrate(100);
      else if (remaining <= 2 && remaining > 1) Vibration.vibrate(100);
      else if (remaining <= 1 && remaining > 0) Vibration.vibrate(100);
      
      if (remaining <= 0) {
        clearInterval(countdownTimer);
        Vibration.vibrate([0, 200, 100, 200]);
        activityStartTimeRef.current = performance.now();
        setState('active');
        setTimeRemaining(currentActivity.duration);
      }
    }, 50);
  };

  const handlePause = () => {
    if (state === 'active' || state === 'rest') {
      previousStateRef.current = state;
      pausedTimeRef.current = performance.now();
      const currentRemaining = timeRemaining;
      pausedDurationRef.current = currentRemaining;
      setState('paused');
      
      setActivityProgresses(prev => prev.map((prog, idx) => 
        idx === currentActivityIndex 
          ? { ...prog, status: 'paused' }
          : prog
      ));
    } else if (state === 'paused') {
      const pauseDuration = (performance.now() - pausedTimeRef.current) / 1000;
      const previousState = previousStateRef.current;
      const targetDuration = previousState === 'active' ? currentActivity.duration : currentActivity.rest;
      activityStartTimeRef.current = performance.now() - (targetDuration - pausedDurationRef.current) * 1000;
      
      setState(previousState);
      setActivityProgresses(prev => prev.map((prog, idx) => 
        idx === currentActivityIndex 
          ? { ...prog, status: previousState === 'active' ? 'active' : 'paused' }
          : prog
      ));
    }
  };

  /**
   * @param {number} activityIndex
   */
  const handleSkipActivity = (activityIndex) => {
    Alert.alert(
      'Skip Activity',
      `Skip "${activities[activityIndex].name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            setActivityProgresses(prev => prev.map((prog, idx) => 
              idx === activityIndex 
                ? { ...prog, status: 'skipped', skippedAt: Date.now() }
                : prog
            ));
            
            if (activityIndex < activities.length - 1) {
              const nextIndex = activityIndex + 1;
              setCurrentActivityIndex(nextIndex);
              setCurrentSet(1);
              setState('ready');
            } else {
              handleWorkoutComplete();
            }
          },
        },
      ]
    );
  };

  /**
   * @param {number} activityIndex
   */
  const handleCompleteActivity = (activityIndex) => {
    const activity = activities[activityIndex];
    const progress = activityProgresses[activityIndex];
    const completedTime = progress.startTime 
      ? (Date.now() - progress.startTime) / 1000
      : activity.duration;
    
    const caloriesBurned = calculateCaloriesBurned(activity.name, activity.duration, activity.sets);
    setTotalCaloriesBurned(prev => prev + caloriesBurned);
    
    setActivityProgresses(prev => prev.map((prog, idx) => 
      idx === activityIndex 
        ? { 
            ...prog, 
            status: 'completed',
            actualDuration: Math.floor(completedTime),
            setsCompleted: activity.sets,
            endTime: Date.now()
          }
        : prog
    ));
    
    if (activityIndex < activities.length - 1) {
      const nextIndex = activityIndex + 1;
      setCurrentActivityIndex(nextIndex);
      setCurrentSet(1);
      setState('ready');
    } else {
      handleWorkoutComplete();
    }
  };

  const handleEndWorkout = () => {
    Alert.alert(
      'End Workout',
      'End this workout? Progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End', style: 'destructive', onPress: handleWorkoutComplete },
      ]
    );
  };

  const handleWorkoutComplete = async () => {
    setState('completed');
    
    const completedActivities = activityProgresses.filter(p => p.status === 'completed');
    const skippedActivities = activityProgresses.filter(p => p.status === 'skipped');
    const completionRate = activities.length > 0 
      ? (completedActivities.length / activities.length) * 100 
      : 0;

    const workoutRecord = {
      date: new Date().toISOString(),
      planName: workoutPlan.planName || 'Workout',
      totalDurationPlanned: workoutPlan.durationMinutes || 0,
      totalDurationActual: Math.floor(totalTimeElapsed / 60),
      activities: activityProgresses.map(prog => ({
        name: prog.activityName,
        status: prog.status,
        durationPlanned: prog.plannedDuration,
        durationActual: prog.actualDuration,
        setsPlanned: prog.setsPlanned,
        setsCompleted: prog.setsCompleted,
        completedAt: prog.endTime ? new Date(prog.endTime).toISOString() : undefined,
        skippedAt: prog.skippedAt ? new Date(prog.skippedAt).toISOString() : undefined,
      })),
      completionRate: Math.round(completionRate),
      activitiesCompleted: completedActivities.length,
      activitiesSkipped: skippedActivities.length,
      caloriesBurned: totalCaloriesBurned,
    };

    try {
      const existing = await AsyncStorage.getItem(WORKOUT_PROGRESS_KEY);
      const history = existing ? JSON.parse(existing) : [];
      history.push(workoutRecord);
      await AsyncStorage.setItem(WORKOUT_PROGRESS_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving workout progress:', error);
    }

    try {
      const existing = await AsyncStorage.getItem(WORKOUT_PROGRESS_KEY);
      const history = existing ? JSON.parse(existing) : [];
      const feedback = generateWorkoutFeedback(workoutRecord, history);
      
      const feedbackMessage = feedback.length > 0 
        ? `\n\n${feedback.join('\n\n')}`
        : '';
      
      Alert.alert(
        '🎉 Workout Complete!',
        `Completed: ${completedActivities.length}/${activities.length}\nTime: ${Math.floor(totalTimeElapsed / 60)} min\n🔥 Calories: ${totalCaloriesBurned} kcal${feedbackMessage}`,
        [{ text: 'Done', onPress: () => onComplete ? onComplete() : router.back() }]
      );
    } catch (error) {
      console.error('Error generating feedback:', error);
      Alert.alert(
        '🎉 Workout Complete!',
        `Completed: ${completedActivities.length}/${activities.length}\nTime: ${Math.floor(totalTimeElapsed / 60)} min\n🔥 Calories: ${totalCaloriesBurned} kcal`,
        [{ text: 'Done', onPress: () => onComplete ? onComplete() : router.back() }]
      );
    }
  };

  /**
   * @returns {string}
   */
  const getProgressColor = () => {
    if (state === 'rest') return '#FF9500';
    if (state === 'active') return '#667eea';
    return '#ccc';
  };

  /**
   * @param {ActivityProgress['status']} status
   * @returns {string}
   */
  const getActivityStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'skipped': return 'cancel';
      case 'active': return 'play-circle-filled';
      case 'paused': return 'pause-circle-filled';
      default: return 'radio-button-unchecked';
    }
  };

  /**
   * @param {ActivityProgress['status']} status
   * @returns {string}
   */
  const getActivityStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'skipped': return '#FF3B30';
      case 'active': return '#667eea';
      case 'paused': return '#FF9500';
      default: return '#ccc';
    }
  };

  // ✅ RENDER: Completed State
  if (state === 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        {/* ✅ Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => onComplete ? onComplete() : router.back()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Workout Complete</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.completedContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Icon name="check-circle" size={100} color="#4CAF50" />
          </Animated.View>
          <Text style={styles.completedTitle}>Great Job! 🎉</Text>
          <View style={styles.completedStats}>
            <View style={styles.completedStat}>
              <Icon name="check" size={24} color="#4CAF50" />
              <Text style={styles.completedStatValue}>
                {activityProgresses.filter(p => p.status === 'completed').length}/{activities.length}
              </Text>
              <Text style={styles.completedStatLabel}>Activities</Text>
            </View>
            <View style={styles.completedStat}>
              <Icon name="schedule" size={24} color="#667eea" />
              <Text style={styles.completedStatValue}>{formatTimeToMMSS(totalTimeElapsed)}</Text>
              <Text style={styles.completedStatLabel}>Time</Text>
            </View>
            <View style={styles.completedStat}>
              <Icon name="local-fire-department" size={24} color="#FF6B6B" />
              <Text style={styles.completedStatValue}>{totalCaloriesBurned}</Text>
              <Text style={styles.completedStatLabel}>kcal</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => onComplete ? onComplete() : router.back()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ RENDER: Idle State
  if (state === 'idle') {
    return (
      <SafeAreaView style={styles.container}>
        {/* ✅ Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Workout Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.idleContainer}>
            <View style={styles.planHeader}>
              <Icon name="fitness-center" size={48} color="#667eea" />
              <Text style={styles.planTitle}>{workoutPlan.planName}</Text>
              <Text style={styles.planSubtitle}>
                {activities.length} exercises • {workoutPlan.durationMinutes || 30} min
              </Text>
            </View>

            <View style={styles.activitiesPreview}>
              <Text style={styles.previewTitle}>Exercises:</Text>
              {activities.map((activity, idx) => (
                <View key={idx} style={styles.previewItem}>
                  <View style={styles.previewNumber}>
                    <Text style={styles.previewNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewItemText}>{activity.name}</Text>
                    <Text style={styles.previewItemDetails}>
                      {activity.sets} sets × {activity.duration}s • {activity.rest}s rest
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#ccc" />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.idleFooter}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Icon name="play-arrow" size={28} color="#fff" />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ RENDER: Countdown State
  if (state === 'countdown') {
    return (
      <SafeAreaView style={styles.container}>
        {/* ✅ Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setState('idle')} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Get Ready</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.countdownContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.countdownText}>{Math.ceil(timeRemaining)}</Text>
          </Animated.View>
          <Text style={styles.countdownLabel}>Starting soon...</Text>
          <Text style={styles.countdownNext}>Next: {currentActivity.name}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ RENDER: Ready State
  if (state === 'ready') {
    const exerciseData = getExerciseData(currentActivity.name) || getDefaultExerciseData(currentActivity.name);
    return (
      <SafeAreaView style={styles.container}>
        {/* ✅ Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setState('idle')} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Activity {currentActivityIndex + 1}/{activities.length}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.readyContainer}>
          <Icon name="fitness-center" size={64} color="#667eea" />
          <Text style={styles.readyTitle}>{currentActivity.name}</Text>
          <Text style={styles.readyDescription}>{exerciseData.description}</Text>
          
          <View style={styles.readyStats}>
            <View style={styles.readyStat}>
              <Icon name="timer" size={28} color="#667eea" />
              <Text style={styles.readyStatValue}>{currentActivity.duration}s</Text>
              <Text style={styles.readyStatLabel}>per set</Text>
            </View>
            <View style={styles.readyStat}>
              <Icon name="repeat" size={28} color="#667eea" />
              <Text style={styles.readyStatValue}>{currentActivity.sets}</Text>
              <Text style={styles.readyStatLabel}>sets</Text>
            </View>
            <View style={styles.readyStat}>
              <Icon name="pause" size={28} color="#FF9500" />
              <Text style={styles.readyStatValue}>{currentActivity.rest}s</Text>
              <Text style={styles.readyStatLabel}>rest</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.readyStartButton}
            onPress={() => {
              activityStartTimeRef.current = performance.now();
              setState('active');
              setTimeRemaining(currentActivity.duration);
            }}
          >
            <Icon name="play-arrow" size={32} color="#fff" />
            <Text style={styles.readyStartText}>Start</Text>
          </TouchableOpacity>
          
          <View style={styles.readyActions}>
            <TouchableOpacity 
              style={styles.readyActionButton}
              onPress={() => handleSkipActivity(currentActivityIndex)}
            >
              <Icon name="skip-next" size={20} color="#FF9500" />
              <Text style={styles.readyActionText}>Skip</Text>
            </TouchableOpacity>
            {/* ✅ COMPLETE BUTTON */}
            <TouchableOpacity 
              style={styles.readyActionButtonComplete}
              onPress={() => handleCompleteActivity(currentActivityIndex)}
            >
              <Icon name="check" size={20} color="#4CAF50" />
              <Text style={styles.readyActionTextComplete}>Mark Complete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ✅ RENDER: Active/Rest/Paused State
  const progressColor = getProgressColor();

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setState('idle')} style={styles.backButton}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.topBarContent}>
          <Text style={styles.topBarTitle}>
            {state === 'active' ? '💪 Active' : state === 'rest' ? '😮‍💨 Rest' : '⏸️ Paused'}
          </Text>
          <Text style={styles.topBarSubtitle}>
            Activity {currentActivityIndex + 1}/{activities.length}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.workoutContainer}>
          {/* Progress Ring */}
          <Animated.View style={[styles.progressContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.progressRing, { borderColor: progressColor }]}>
              <View style={styles.progressInner}>
                <Text style={styles.timeText}>{formatTimeToMMSS(timeRemaining)}</Text>
                <Text style={styles.activityName} numberOfLines={2}>{currentActivity.name}</Text>
                <Text style={styles.setText}>Set {currentSet}/{currentActivity.sets}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ✅ Activity List - FIXED */}
          <View style={styles.activityListContainer}>
            <Text style={styles.activityListTitle}>All Activities</Text>
            {activities.map((item, index) => {
              const prog = activityProgresses[index] || { status: 'not_started' };
              const isCurrent = index === currentActivityIndex;
              return (
                <View
                  key={`activity-${index}`}
                  style={[
                    styles.activityListItem,
                    isCurrent && styles.activityListItemCurrent,
                  ]}
                >
                  <Icon 
                    name={getActivityStatusIcon(prog.status)} 
                    size={24} 
                    color={getActivityStatusColor(prog.status)} 
                  />
                  <View style={styles.activityListItemContent}>
                    <Text style={styles.activityListItemName}>{item.name}</Text>
                    <Text style={styles.activityListItemDetails}>
                      {prog.status === 'completed' 
                        ? `✓ Completed` 
                        : prog.status === 'skipped'
                        ? `⏭️ Skipped`
                        : `${item.sets} sets × ${item.duration}s`
                      }
                    </Text>
                  </View>
                  {/* ✅ COMPLETE BUTTON for each activity */}
                  {prog.status === 'not_started' && !isCurrent && (
                    <TouchableOpacity
                      style={styles.miniCompleteButton}
                      onPress={() => handleCompleteActivity(index)}
                    >
                      <Icon name="check" size={18} color="#4CAF50" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Stats Footer */}
          <View style={styles.statsFooter}>
            <View style={styles.statFooterItem}>
              <Icon name="schedule" size={18} color="#666" />
              <Text style={styles.statFooterText}>{formatTimeToMMSS(totalTimeElapsed)}</Text>
            </View>
            <View style={styles.statFooterItem}>
              <Icon name="local-fire-department" size={18} color="#FF6B6B" />
              <Text style={styles.statFooterText}>{totalCaloriesBurned} kcal</Text>
            </View>
            <View style={styles.statFooterItem}>
              <Icon name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.statFooterText}>
                {activityProgresses.filter(p => p.status === 'completed').length}/{activities.length}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={handleEndWorkout}>
          <Icon name="stop" size={24} color="#FF3B30" />
          <Text style={styles.controlButtonText}>End</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButtonPrimary} onPress={handlePause}>
          <Icon name={state === 'paused' ? 'play-arrow' : 'pause'} size={36} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={() => handleCompleteActivity(currentActivityIndex)}>
          <Icon name="check" size={24} color="#4CAF50" />
          <Text style={styles.controlButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
  
  // ✅ Top Bar with Back Button
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  placeholder: { width: 40 },
  
  // Idle State
  idleContainer: { padding: 20 },
  planHeader: { alignItems: 'center', marginBottom: 24 },
  planTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 12, textAlign: 'center' },
  planSubtitle: { fontSize: 14, color: '#666', marginTop: 6, textAlign: 'center' },
  previewTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  activitiesPreview: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20 },
  previewItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  previewNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  previewNumberText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  previewInfo: { flex: 1 },
  previewItemText: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  previewItemDetails: { fontSize: 12, color: '#999' },
  idleFooter: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#667eea', paddingVertical: 16, borderRadius: 12 },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  
  // Countdown
  countdownContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  countdownText: { fontSize: 120, fontWeight: 'bold', color: '#667eea' },
  countdownLabel: { fontSize: 24, color: '#666', marginTop: 20 },
  countdownNext: { fontSize: 16, color: '#999', marginTop: 12 },
  
  // Ready State
  readyContainer: { padding: 32, alignItems: 'center' },
  readyTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 16, textAlign: 'center' },
  readyDescription: { fontSize: 15, color: '#666', textAlign: 'center', marginTop: 12, marginBottom: 32, lineHeight: 22 },
  readyStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 32 },
  readyStat: { alignItems: 'center' },
  readyStatValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 8 },
  readyStatLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  readyStartButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#667eea', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 12, marginBottom: 20 },
  readyStartText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  readyActions: { flexDirection: 'row', gap: 12 },
  readyActionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFF3E0' },
  readyActionButtonComplete: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#E8F5E9' },
  readyActionText: { fontSize: 14, color: '#FF9500', marginLeft: 6, fontWeight: '600' },
  readyActionTextComplete: { fontSize: 14, color: '#4CAF50', marginLeft: 6, fontWeight: '600' },
  
  // Active State
  workoutContainer: { padding: 16 },
  progressContainer: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  progressRing: { width: 260, height: 260, borderRadius: 130, borderWidth: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  progressInner: { alignItems: 'center' },
  timeText: { fontSize: 52, fontWeight: 'bold', color: '#333' },
  activityName: { fontSize: 17, fontWeight: '600', color: '#333', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  setText: { fontSize: 13, color: '#999', marginTop: 4 },
  
  // ✅ Activity List - FIXED
  activityListContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  activityListTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  activityListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, marginBottom: 8 },
  activityListItemCurrent: { backgroundColor: '#E3F2FD' },
  activityListItemContent: { flex: 1, marginLeft: 12 },
  activityListItemName: { fontSize: 15, fontWeight: '600', color: '#333' },
  activityListItemDetails: { fontSize: 12, color: '#999', marginTop: 2 },
  miniCompleteButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  
  // Controls
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  controlButton: { alignItems: 'center' },
  controlButtonPrimary: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  controlButtonText: { fontSize: 12, color: '#666', marginTop: 4, fontWeight: '600' },
  
  // Stats Footer
  statsFooter: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16 },
  statFooterItem: { flexDirection: 'row', alignItems: 'center' },
  statFooterText: { fontSize: 13, fontWeight: '600', color: '#333', marginLeft: 6 },
  
  // Completed
  completedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  completedTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 24, marginBottom: 32 },
  completedStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 32 },
  completedStat: { alignItems: 'center' },
  completedStatValue: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 12 },
  completedStatLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  doneButton: { backgroundColor: '#667eea', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

