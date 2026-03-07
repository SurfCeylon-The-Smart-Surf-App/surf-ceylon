import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@surf_tutor_profile';

/**
 * Unified Surf Tutor Profile
 * @typedef {Object} SurfTutorProfile
 * @property {string} fitnessLevel - Cardio fitness level (Beginner, Intermediate, Pro)
 * @property {string} experienceLevel - Surfing experience level (Beginner, Intermediate, Advanced)
 * @property {string} goal - Fitness goal (Warm up only, Improve endurance, Improve explosive pop-up speed)
 * @property {string} trainingDuration - Training duration (5-10 minutes, 10-20 minutes, 20+ minutes)
 * @property {number} [height] - Height in cm
 * @property {number} [weight] - Weight in kg
 * @property {number} [age] - Age in years
 * @property {string} [gender] - Gender (Male, Female, Other)
 * @property {string} [equipment] - Equipment available (None, Kettlebell, Gym)
 * @property {string[]} [limitations] - Physical limitations
 * @property {boolean} [completed] - Whether quiz is completed
 * @property {string} [completedAt] - Completion timestamp
 */

/**
 * Surf Tutor Profile Context Type
 * @typedef {Object} SurfTutorProfileContextType
 * @property {SurfTutorProfile|null} profile - Current profile
 * @property {boolean} isLoading - Loading state
 * @property {function(): Promise<void>} loadProfile - Load profile from storage
 * @property {function(SurfTutorProfile): Promise<void>} saveProfile - Save profile to storage
 * @property {function(): Promise<void>} clearProfile - Clear profile
 * @property {boolean} isQuizCompleted - Whether quiz is completed
 * @property {function(): Promise<void>} refreshProfile - Refresh profile
 */

/** @type {React.Context<SurfTutorProfileContextType|undefined>} */
const SurfTutorProfileContext = createContext(undefined);

export const surfTutorProfileStorage = {
  /**
   * Load profile from storage
   * @returns {Promise<SurfTutorProfile|null>}
   */
  async load() {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      if (data) {
        const profile = JSON.parse(data);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error loading surf tutor profile:', error);
      return null;
    }
  },

  /**
   * Save profile to storage
   * @param {SurfTutorProfile} profile - Profile to save
   * @returns {Promise<void>}
   */
  async save(profile) {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving surf tutor profile:', error);
      throw error;
    }
  },

  /**
   * Clear profile from storage
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await AsyncStorage.removeItem(PROFILE_KEY);
    } catch (error) {
      console.error('Error clearing surf tutor profile:', error);
      throw error;
    }
  },
};

/**
 * Surf Tutor Profile Provider Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function SurfTutorProfileProvider({ children }) {
  /** @type {[SurfTutorProfile|null, function]} */
  const [profile, setProfile] = useState(null);
  /** @type {[boolean, function]} */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load profile from storage on mount
   */
  useEffect(() => {
    loadProfile();
  }, []);

  /**
   * Load profile
   */
  const loadProfile = async () => {
    try {
      const loadedProfile = await surfTutorProfileStorage.load();
      setProfile(loadedProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save profile to storage
   * @param {SurfTutorProfile} newProfile - Profile to save
   */
  const saveProfile = async (newProfile) => {
    try {
      setProfile(newProfile);
      await surfTutorProfileStorage.save(newProfile);
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  };

  /**
   * Clear profile
   */
  const clearProfile = async () => {
    try {
      await surfTutorProfileStorage.clear();
      setProfile(null);
    } catch (error) {
      console.error('Failed to clear profile:', error);
    }
  };

  const value = {
    profile,
    isLoading,
    loadProfile,
    saveProfile,
    clearProfile,
    isQuizCompleted: profile?.completed || false,
    refreshProfile: loadProfile,
  };

  return (
    <SurfTutorProfileContext.Provider value={value}>
      {children}
    </SurfTutorProfileContext.Provider>
  );
}

/**
 * Hook to use Surf Tutor Profile Context
 * @returns {SurfTutorProfileContextType}
 */
export function useSurfTutorProfile() {
  const context = useContext(SurfTutorProfileContext);
  if (context === undefined) {
    throw new Error('useSurfTutorProfile must be used within a SurfTutorProfileProvider');
  }
  return context;
}
