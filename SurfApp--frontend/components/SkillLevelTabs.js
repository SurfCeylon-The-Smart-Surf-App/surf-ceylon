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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  skillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  skillButtonActive: {
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  skillIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  skillButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  skillButtonDesc: {
    fontSize: 11,
    color: '#9ca3af',
  },
});

export default SkillLevelTabs;