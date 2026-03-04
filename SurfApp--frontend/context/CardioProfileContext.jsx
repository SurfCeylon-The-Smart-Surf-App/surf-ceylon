import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@cardio_profile';

/**
 * Cardio Profile interface
 * @typedef {Object} CardioProfile
 * @property {string} fitnessLevel - Fitness level
 * @property {string} goal - Fitness goal
 * @property {string} trainingDuration - Training duration
 * @property {number} [height] - Height in cm
 * @property {number} [weight] - Weight in kg
 * @property {string} [equipment] - Equipment available
 * @property {string[]} [limitations] - Physical limitations
 * @property {boolean} [completed] - Whether quiz is completed
 * @property {string} [completedAt] - Completion timestamp
 */

/**
 * Cardio Profile Context Type
 * @typedef {Object} CardioProfileContextType
 * @property {CardioProfile|null} profile - Current profile
 * @property {boolean} isLoading - Loading state
 * @property {function(): Promise<void>} loadProfile - Load profile from storage
 * @property {function(CardioProfile): Promise<void>} saveProfile - Save profile to storage
 * @property {function(): Promise<void>} clearProfile - Clear profile
 * @property {boolean} isQuizCompleted - Whether quiz is completed
 * @property {function(): Promise<void>} refreshProfile - Refresh profile
 */

/** @type {React.Context<CardioProfileContextType|undefined>} */
const CardioProfileContext = createContext(undefined);

// ✅ UPDATED: Storage utilities with equipment support
export const cardioProfileStorage = {
  /**
   * Load profile from storage
   * @returns {Promise<CardioProfile|null>}
   */
  async load() {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      if (data) {
        const profile = JSON.parse(data);
        // Ensure equipment field exists (for backward compatibility)
        if (!profile.equipment) {
          profile.equipment = 'None';
        }
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error loading cardio profile:', error);
      return null;
    }
  },

  /**
   * Save profile to storage
   * @param {CardioProfile} profile - Profile to save
   * @returns {Promise<void>}
   */
  async save(profile) {
    try {
      // Ensure equipment field is set
      if (!profile.equipment) {
        profile.equipment = 'None';
      }
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving cardio profile:', error);
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
      console.error('Error clearing cardio profile:', error);
      throw error;
    }
  },
};

/**
 * Cardio Profile Provider Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function CardioProfileProvider({ children }) {
  /** @type {[CardioProfile|null, function]} */
  const [profile, setProfile] = useState(null);
  /** @type {[boolean, function]} */
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const loadedProfile = await cardioProfileStorage.load();
      setProfile(loadedProfile);
    } catch (error) {
      console.error('Error loading cardio profile:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save profile
   * @param {CardioProfile} newProfile - Profile to save
   * @returns {Promise<void>}
   */
  const saveProfile = async (newProfile) => {
    try {
      await cardioProfileStorage.save(newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error('Error saving cardio profile:', error);
      throw error;
    }
  };

  const clearProfile = async () => {
    try {
      await cardioProfileStorage.clear();
      setProfile(null);
    } catch (error) {
      console.error('Error clearing cardio profile:', error);
    }
  };

  return (
    <CardioProfileContext.Provider
      value={{
        profile,
        isLoading,
        loadProfile,
        saveProfile,
        clearProfile,
        refreshProfile: loadProfile,
        isQuizCompleted: profile?.completed === true,
      }}
    >
      {children}
    </CardioProfileContext.Provider>
  );
}

export function useCardioProfile() {
  const context = useContext(CardioProfileContext);
  if (context === undefined) {
    throw new Error('useCardioProfile must be used within a CardioProfileProvider');
  }
  return context;
}

export default CardioProfileContext;