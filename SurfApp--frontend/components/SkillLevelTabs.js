// mobile-app/src/components/SkillLevelTabs.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SKILL_LEVELS } from '../utils/constants';
import { getSkillLevelInfo } from '../utils/helpers';

const SkillLevelTabs = ({ selectedSkillLevel, onSkillChange }) => {
  const renderSkillButton = (skillLevel) => {
    const skillInfo = getSkillLevelInfo(skillLevel);
    const isSelected = selectedSkillLevel === skillLevel;

    return (
      <TouchableOpacity
        key={skillLevel}
        style={[
          styles.skillButton,
          isSelected && styles.skillButtonActive,
          { borderColor: isSelected ? skillInfo.color : '#e5e7eb' }
        ]}
        onPress={() => onSkillChange(skillLevel)}
        activeOpacity={0.7}
      >
        <Text style={styles.skillIcon}>{skillInfo.icon}</Text>
        <View>
          <Text style={[
            styles.skillButtonText,
            isSelected && { color: skillInfo.color }
          ]}>
            {skillInfo.label}
          </Text>
          <Text style={styles.skillButtonDesc}>{skillInfo.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.values(SKILL_LEVELS).map(renderSkillButton)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 3,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  skillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 140,
  },
  skillButtonActive: {
    backgroundColor: '#eff6ff',
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  skillIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  skillButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  skillButtonDesc: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default SkillLevelTabs;