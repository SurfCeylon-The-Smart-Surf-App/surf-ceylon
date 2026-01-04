import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { getSurfSpots } from '../services/riskAnalyzerAPI';
import { SKILL_LEVELS } from '../utils/riskAnalyzerConstants';
import { getRiskDataForSkill, getRiskLevelForSkill, getThresholdRanges, getSkillLevelInfo } from '../utils/riskAnalyzerHelpers';
import SkillLevelTabs from '../components/SkillLevelTabs';
import WebMapView from '../components/WebMapView';

export default function RiskAnalyzerScreen() {
  const router = useRouter();
  const [surfSpots, setSurfSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState(SKILL_LEVELS.BEGINNER);
  const [viewMode, setViewMode] = useState('map');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSurfSpots();
  }, []);

  const loadSurfSpots = async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);
      
      const response = await getSurfSpots();
      const spots = response.data || [];
      
      console.log('✅ Loaded', spots.length, 'surf spots');
      setSurfSpots(spots);
      
    } catch (err) {
      console.error('❌ Error loading surf spots:', err);
      setError(err.message || 'Failed to load data');
      Alert.alert('Connection Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSurfSpots();
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading surf spots...</Text>
      </View>
    );
  }

  // Error state
  if (error && !refreshing && surfSpots.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Connection Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSurfSpots}>
          <Text style={styles.retryButtonText}>🔄 Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={["top"]} style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Surf Risk Analyzer</Text>
          <Text style={styles.headerSubtitle}>
            Risk assessment for surf spots
          </Text>
        </SafeAreaView>
      </LinearGradient>

      {/* Skill Level Tabs */}
      <SkillLevelTabs
        selectedSkillLevel={selectedSkillLevel}
        onSkillChange={setSelectedSkillLevel}
      />

      {/* Threshold Banner */}
      {renderThresholdBanner()}

      {/* Safety Notice */}
      {renderSafetyNotice()}

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
            🗺️ Map View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            📋 List View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map or List View */}
      {viewMode === 'map' ? renderMapView() : renderListView()}

      {/* Bottom Safety Notice */}
      <View style={styles.bottomSafetyNotice}>
        <Text style={styles.bottomSafetyTitle}>Surf Risk Analyzer</Text>
        <Text style={styles.bottomSafetyText}>
          Risk scores updated daily based on historical incidents and current hazard reports.
        </Text>
      </View>

      {/* Floating Report Button */}
      <TouchableOpacity 
        style={styles.fabButton} 
        onPress={() => router.push('/reportHazard')}
      >
        <Text style={styles.fabIcon}>⚠️</Text>
        <Text style={styles.fabText}>Report Hazard</Text>
      </TouchableOpacity>
    </View>
  );

  function renderThresholdBanner() {
    const thresholds = getThresholdRanges(selectedSkillLevel);
    const skillInfo = getSkillLevelInfo(selectedSkillLevel);

    return (
      <View style={styles.thresholdBanner}>
        <Text style={styles.thresholdTitle}>
          {skillInfo.icon} Risk Levels for {skillInfo.label}
        </Text>
        <View style={styles.thresholdRow}>
          <View style={styles.thresholdItem}>
            <View style={[styles.thresholdIconCircle, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.thresholdEmoji}>{thresholds.low.emoji}</Text>
            </View>
            <Text style={styles.thresholdLabel}>Low Risk</Text>
            <Text style={styles.thresholdRange}>{thresholds.low.label}</Text>
          </View>
          <View style={styles.thresholdDivider} />
          <View style={styles.thresholdItem}>
            <View style={[styles.thresholdIconCircle, { backgroundColor: '#fef3c7' }]}>
              <Text style={styles.thresholdEmoji}>{thresholds.medium.emoji}</Text>
            </View>
            <Text style={styles.thresholdLabel}>Medium Risk</Text>
            <Text style={styles.thresholdRange}>{thresholds.medium.label}</Text>
          </View>
          <View style={styles.thresholdDivider} />
          <View style={styles.thresholdItem}>
            <View style={[styles.thresholdIconCircle, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.thresholdEmoji}>{thresholds.high.emoji}</Text>
            </View>
            <Text style={styles.thresholdLabel}>High Risk</Text>
            <Text style={styles.thresholdRange}>{thresholds.high.label}</Text>
          </View>
        </View>
      </View>
    );
  }

  // Safety Notice Component
  function renderSafetyNotice() {
    return (
      <View style={styles.safetyNotice}>
        <View style={styles.safetyNoticeHeader}>
          <View style={styles.safetyIconContainer}>
            <Text style={styles.safetyIcon}>ℹ️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyNoticeTitle}>Safety First</Text>
            <Text style={styles.safetyNoticeText}>
              Always check current conditions before surfing. Risk scores are based on historical incidents (Rip current, Sea Urchins, Drowning, etc.) data.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function renderMapView() {
    return (
      <View style={{ flex: 1 }}>
        <WebMapView
          surfSpots={surfSpots}
          selectedSpot={selectedSpot}
          selectedSkillLevel={selectedSkillLevel}
          onSpotSelect={setSelectedSpot}
        />
      </View>
    );
  }

  function renderListView() {
    const sortedSpots = [...surfSpots].sort((a, b) => {
      const scoreA = getRiskDataForSkill(a, selectedSkillLevel).score;
      const scoreB = getRiskDataForSkill(b, selectedSkillLevel).score;
      return scoreB - scoreA;
    });

    return (
      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {sortedSpots.map(spot => {
          const riskData = getRiskDataForSkill(spot, selectedSkillLevel);
          const riskLevel = getRiskLevelForSkill(riskData.score, selectedSkillLevel);

          return (
            <TouchableOpacity
              key={spot._id}
              style={styles.spotCard}
              onPress={() => {
                setSelectedSpot(spot);
                setViewMode('map');
              }}
            >
              <View style={styles.spotCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spotName}>{spot.name}</Text>
                  <View style={styles.spotLocationRow}>
                    <Text style={styles.spotLocationIcon}>📍</Text>
                    <Text style={styles.spotLocation}>{spot.location}</Text>
                  </View>
                </View>
                <View style={styles.spotScoreContainer}>
                  <View style={[styles.scoreCircle, { backgroundColor: riskLevel.color + '20', borderColor: riskLevel.color }]}>
                    <Text style={[styles.scoreValue, { color: riskLevel.color }]}>
                      {riskData.score.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.spotCardFooter}>
                <View style={[styles.riskBadge, { backgroundColor: riskLevel.bgColor }]}>
                  <Text style={[styles.riskBadgeText, { color: riskLevel.textColor }]}>
                    {riskLevel.emoji} {riskLevel.level} Risk
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f3f4f6' },
  
  // Header Styles
  headerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#bfdbfe',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#1f2937' },
  errorEmoji: { fontSize: 64, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#ef4444', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  retryButton: { 
    backgroundColor: '#2563eb', 
    paddingVertical: 14, 
    paddingHorizontal: 32, 
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  retryButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },

  // Threshold Banner
  thresholdBanner: { 
    backgroundColor: 'white',
    paddingVertical: 16, 
    paddingHorizontal: 16, 
    borderBottomWidth: 1, 
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  thresholdTitle: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#1f2937',
    textAlign: 'center', 
    marginBottom: 14 
  },
  thresholdRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  thresholdItem: { alignItems: 'center', flex: 1 },
  thresholdIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  thresholdEmoji: { fontSize: 24 },
  thresholdLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  thresholdRange: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  thresholdDivider: { width: 1, height: 50, backgroundColor: '#e5e7eb', marginHorizontal: 4 },

  // Safety Notice
  safetyNotice: {
    backgroundColor: '#eff6ff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  safetyNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safetyIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  safetyIcon: {
    fontSize: 16,
  },
  safetyNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  safetyNoticeText: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
  },

  // View Toggle
  viewToggle: { 
    flexDirection: 'row', 
    padding: 12, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderColor: '#e5e7eb',
    gap: 8,
  },
  toggleButton: { 
    flex: 1, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    backgroundColor: '#f3f4f6', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleButtonActive: { 
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  toggleTextActive: { color: 'white' },

  // List View
  listContainer: { flex: 1, padding: 16 },
  spotCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  spotCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  spotName: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111827', 
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  spotLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotLocationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  spotLocation: { 
    fontSize: 14, 
    color: '#6b7280',
    fontWeight: '500',
  },
  spotScoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: { 
    fontSize: 22, 
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  spotCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskBadgeText: { 
    fontSize: 13, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Bottom Safety Notice
  bottomSafetyNotice: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bottomSafetyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  bottomSafetyText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Floating Action Button
  fabButton: { 
    position: 'absolute', 
    bottom: 80, 
    right: 24, 
    backgroundColor: '#2563eb', 
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28, 
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8, 
    shadowColor: '#2563eb', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 8,
    gap: 8,
  },
  fabIcon: { fontSize: 20 },
  fabText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});