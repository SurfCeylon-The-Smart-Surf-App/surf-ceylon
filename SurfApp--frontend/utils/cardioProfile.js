import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * @typedef {Object} CardioProfile
 * @property {string} fitnessLevel
 * @property {string} goal
 * @property {string} trainingDuration
 * @property {number} [height]
 * @property {number} [weight]
 * @property {string[]} [limitations]
 * @property {boolean} completed
 * @property {string} completedAt
 */

const CARDIO_PROFILE_KEY = '@cardio_profile';

export const cardioProfileStorage = {
  /**
   * @param {CardioProfile} profile
   * @returns {Promise<void>}
   */
  async save(profile) {
    try {
      const profileData = {
        ...profile,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(CARDIO_PROFILE_KEY, JSON.stringify(profileData));
    } catch (error) {
      console.error('Error saving cardio profile:', error);
      throw error;
    }
  },

  /**
   * @returns {Promise<CardioProfile|null>}
   */
  async load() {
    try {
      const data = await AsyncStorage.getItem(CARDIO_PROFILE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error loading cardio profile:', error);
      return null;
    }
  },

  /**
   * @returns {Promise<boolean>}
   */
  async isCompleted() {
    try {
      const profile = await this.load();
      return profile?.completed === true;
    } catch (error) {
      return false;
    }
  },

  /**
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await AsyncStorage.removeItem(CARDIO_PROFILE_KEY);
    } catch (error) {
      console.error('Error clearing cardio profile:', error);
    }
  },
};

