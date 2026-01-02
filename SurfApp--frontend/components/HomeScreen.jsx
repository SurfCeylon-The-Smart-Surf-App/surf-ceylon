import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function HomeScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🏄</Text>
          <Text style={styles.title}>Surf Tutor AI</Text>
          <Text style={styles.subtitle}>Your Personal Surfing Coach</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push('/(tabs)/cardio')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FF6B6B20' }]}>
              <Icon name="fitness-center" size={36} color="#FF6B6B" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Cardio Plans</Text>
              <Text style={styles.cardDescription}>
                Get personalized AI-generated cardio workout recommendations
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push('/(tabs)/ar')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#4ECDC420' }]}>
              <Icon name="3d-rotation" size={36} color="#4ECDC4" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Sea Drills (AR)</Text>
              <Text style={styles.cardDescription}>
                Visualize surfing techniques with AR in your environment
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push('/(tabs)/practice')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#45B7D120' }]}>
              <Icon name="camera-alt" size={36} color="#45B7D1" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Land Drills</Text>
              <Text style={styles.cardDescription}>
                Practice poses with real-time AI coaching feedback
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push('/(tabs)/progress')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#96CEB420' }]}>
              <Icon name="trending-up" size={36} color="#96CEB4" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Progress</Text>
              <Text style={styles.cardDescription}>
                Track your progress, badges, and achievements
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#9B59B620' }]}>
              <Icon name="person" size={36} color="#9B59B6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Profile</Text>
              <Text style={styles.cardDescription}>
                Manage your profile and settings
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardButton: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
});

