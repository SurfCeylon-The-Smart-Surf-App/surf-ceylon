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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getSurfSpots } from '../services/risk_api';
import { SKILL_LEVELS } from '../utils/constants';
import { getRiskDataForSkill, getRiskLevelForSkill, getThresholdRanges, getSkillLevelInfo } from '../utils/helpers';
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
      
      console.log('Loaded', spots.length, 'surf spots');
      setSurfSpots(spots);
      
    } catch (err) {
      console.error('Error loading surf spots:', err);
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

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
        <Text style={styles.loadingText}>Loading surf spots...</Text>
      </View>
    );
  }

  if (error && !refreshing && surfSpots.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorEmoji}>Warning</Text>
        <Text style={styles.errorTitle}>Connection Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSurfSpots}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
      
      {/* Blue Gradient Header */}
      <LinearGradient
        colors={['#3b82f6', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitleWithBack}>Risk Analyzer</Text>
        </View>
        <Text style={styles.headerSubtitle}>Assess surf spot risk levels</Text>
      </LinearGradient>

      <SkillLevelTabs
        selectedSkillLevel={selectedSkillLevel}
        onSkillChange={setSelectedSkillLevel}
      />

      {renderThresholdBanner()}
      {renderSafetyNotice()}

      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            List
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'map' ? renderMapView() : renderListView()}

      <View style={styles.bottomBanner}>
        <Text style={styles.bottomBannerTitle}>Surf Risk Analyzer</Text>
        <Text style={styles.bottomBannerText}>
          Risk scores updated daily based on historical incidents and current hazard reports.
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.fabButton} 
        onPress={() => router.push('/ReportHazardScreen')}
      >
        <Text style={styles.fabIcon}>!</Text>
        <Text style={styles.fabText}>Report</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  function renderThresholdBanner() {
    const thresholds = getThresholdRanges(selectedSkillLevel);
    const skillInfo = getSkillLevelInfo(selectedSkillLevel);

    return (
      <View style={[styles.thresholdBanner, { backgroundColor: skillInfo.color + '15' }]}>
        <Text style={[styles.thresholdTitle, { color: skillInfo.color }]}>
          {skillInfo.icon} {skillInfo.label} Risk Thresholds
        </Text>
        <View style={styles.thresholdRow}>
          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdEmoji}>{thresholds.low.emoji}</Text>
            <Text style={styles.thresholdLabel}>Low</Text>
            <Text style={styles.thresholdRange}>{thresholds.low.label}</Text>
          </View>
          <View style={styles.thresholdDivider} />
          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdEmoji}>{thresholds.medium.emoji}</Text>
            <Text style={styles.thresholdLabel}>Medium</Text>
            <Text style={styles.thresholdRange}>{thresholds.medium.label}</Text>
          </View>
          <View style={styles.thresholdDivider} />
          <View style={styles.thresholdItem}>
            <Text style={styles.thresholdEmoji}>{thresholds.high.emoji}</Text>
            <Text style={styles.thresholdLabel}>High</Text>
            <Text style={styles.thresholdRange}>{thresholds.high.label}</Text>
          </View>
        </View>
      </View>
    );
  }

  function renderSafetyNotice() {
    return (
      <View style={styles.safetyNotice}>
        <View style={styles.safetyNoticeHeader}>
          <View style={styles.safetyIconContainer}>
            <Text style={styles.safetyIcon}>i</Text>
          </View>
          <Text style={styles.safetyNoticeTitle}>Safety Notice</Text>
        </View>
        <Text style={styles.safetyNoticeText}>
          Always check current conditions before surfing. Risk scores are based on historical data.
        </Text>
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
              style={[styles.spotCard, { borderLeftColor: riskLevel.color }]}
              onPress={() => {
                setSelectedSpot(spot);
                setViewMode('map');
              }}
            >
              <View style={styles.spotCardContent}>
                <View style={styles.spotInfo}>
                  <Text style={styles.spotName}>{spot.name}</Text>
                  <Text style={styles.spotLocation}>{spot.location}</Text>
                  <View style={[styles.riskBadge, { backgroundColor: riskLevel.bgColor }]}>
                    <Text style={[styles.riskBadgeText, { color: riskLevel.textColor }]}>
                      {riskLevel.emoji} {riskLevel.level} Risk
                    </Text>
                  </View>
                </View>
                <View style={styles.spotScore}>
                  <Text style={[styles.scoreValue, { color: riskLevel.color }]}>
                    {riskData.score.toFixed(1)}
                  </Text>
                  <Text style={styles.scoreLabel}>/10</Text>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  // Header styles
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleWithBack: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 40,
  },

  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#374151' },
  errorEmoji: { fontSize: 64, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#ef4444', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  retryButton: { backgroundColor: '#0891b2', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  retryButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },

  thresholdBanner: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  thresholdTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  thresholdRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  thresholdItem: { alignItems: 'center', flex: 1 },
  thresholdEmoji: { fontSize: 20, marginBottom: 4 },
  thresholdLabel: { fontSize: 11, fontWeight: '600', color: '#374151', marginBottom: 2 },
  thresholdRange: { fontSize: 10, color: '#6b7280' },
  thresholdDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },

  safetyNotice: {
    backgroundColor: '#dbeafe',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  safetyNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  safetyIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  safetyIcon: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  safetyNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
  },
  safetyNoticeText: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
    paddingLeft: 32,
  },

  viewToggle: { flexDirection: 'row', padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  toggleButton: { flex: 1, paddingVertical: 10, paddingHorizontal: 16, marginHorizontal: 4, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' },
  toggleButtonActive: { backgroundColor: '#0891b2' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  toggleTextActive: { color: 'white' },

  listContainer: { flex: 1, padding: 16 },
  spotCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  spotCardContent: { flexDirection: 'row', justifyContent: 'space-between' },
  spotInfo: { flex: 1, paddingRight: 12 },
  spotName: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  spotLocation: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  riskBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  riskBadgeText: { fontSize: 12, fontWeight: '700' },
  spotScore: { alignItems: 'center', paddingLeft: 12, borderLeftWidth: 1, borderColor: '#e5e7eb' },
  scoreValue: { fontSize: 32, fontWeight: 'bold', lineHeight: 36 },
  scoreLabel: { fontSize: 12, color: '#9ca3af', marginTop: -4 },

  fabButton: { position: 'absolute', bottom: 84, right: 24, backgroundColor: '#ef4444', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  fabIcon: { fontSize: 24, color: 'white', fontWeight: 'bold' },
  fabText: { color: 'white', fontSize: 10, fontWeight: '600', marginTop: 2 },

  bottomBanner: {
    backgroundColor: '#f3f4f6',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bottomBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  bottomBannerText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});
