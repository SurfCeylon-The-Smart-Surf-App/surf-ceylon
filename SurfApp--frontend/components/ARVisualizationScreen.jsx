import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/MaterialIcons";
import { API_BASE_URL } from "../constants/config";

const techniques = [
  {
    id: "paddling-technique",
    name: "Paddling Technique & Posture",
    description: "Shows the correct arched back and arm stroke rhythm",
    icon: "rowing",
  },
  {
    id: "pop-up",
    name: "The Pop-Up",
    description: "Demonstrates the explosive transition from lying down to standing",
    icon: "sports-surfing",
  },
  {
    id: "surfing-stance",
    name: "Surfing Stance & Balance",
    description: "Displays the ideal low-center-of-gravity stance",
    icon: "accessibility",
  },
  {
    id: "safely-falling",
    name: "Safely Falling & Dismounting",
    description: "Teaches how to fall away from the board and protect the head",
    icon: "shield",
  },
  {
    id: "bottom-turn",
    name: "The Bottom Turn (Mechanics)",
    description: "Visualizes the deep compression and body rotation needed to start a turn",
    icon: "arrow-downward",
  },
  {
    id: "generating-speed",
    name: "Generating Speed (Pumping)",
    description: "Shows the rhythmic up-and-down weighting and unweighting movement",
    icon: "speed",
  },
  {
    id: "cutback",
    name: "The Cutback (Mechanics)",
    description: "Demonstrates leading with the head and shoulders to turn back toward the wave's power",
    icon: "swap-horiz",
  },
  {
    id: "tube-riding",
    name: "Tube Riding Stance",
    description: "Shows the extreme crouch required to fit inside a virtual barrel",
    icon: "water",
  },
  {
    id: "catching-whitewater",
    name: "Catching Whitewater Waves",
    description: "Shows where to position the board on a broken wave",
    icon: "waves",
  },
  {
    id: "catching-green-waves",
    name: "Catching Green (Unbroken) Waves",
    description: "Visualizes the timing and angled takeoff for open wave faces",
    icon: "eco",
  },
  {
    id: "trimming-angling",
    name: "Trimming & Angling Down the Line",
    description: "Demonstrates the diagonal path to take to stay ahead of the breaking lip",
    icon: "timeline",
  },
  {
    id: "floater",
    name: "The Floater",
    description: "Shows the path of riding up and over a breaking section of the wave",
    icon: "flight",
  },
  {
    id: "re-entry-snap",
    name: "The Re-entry / Snap",
    description: "Visualizes a sharp, vertical turn off the top of the wave",
    icon: "rotate-right",
  },
  {
    id: "roundhouse-cutback",
    name: "The Roundhouse Cutback",
    description: "Displays the full figure-8 path returning to the whitewater and rebounding",
    icon: "loop",
  },
  {
    id: "aerial",
    name: "The Air / Aerial",
    description: "Demonstrates the approach, launch, and landing absorption (Advanced)",
    icon: "flight-takeoff",
  },
];

export default function ARVisualizationScreen() {
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // User input state
  const [userProfile, setUserProfile] = useState({
    height_cm: '',
    weight_kg: '',
    age: '',
    experience_level: 'Beginner',
    gender: 'Male'
  });
  
  const { useRouter } = require("expo-router");
  const router = useRouter();

  const handleSelectTechnique = (techniqueId) => {
    setSelectedTechnique(techniqueId);
    setShowUserForm(true);
    setRecommendations(null);
  };

  const handleGetRecommendations = async () => {
    // Validate inputs
    if (!userProfile.height_cm || !userProfile.weight_kg || !userProfile.age) {
      Alert.alert("Missing Information", "Please fill in all required fields (height, weight, age)");
      return;
    }

    const height = parseFloat(userProfile.height_cm);
    const weight = parseFloat(userProfile.weight_kg);
    const age = parseInt(userProfile.age);

    if (height < 100 || height > 250) {
      Alert.alert("Invalid Height", "Please enter height between 100-250 cm");
      return;
    }

    if (weight < 30 || weight > 200) {
      Alert.alert("Invalid Weight", "Please enter weight between 30-200 kg");
      return;
    }

    if (age < 10 || age > 100) {
      Alert.alert("Invalid Age", "Please enter age between 10-100 years");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ar/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          height_cm: height,
          weight_kg: weight,
          age: age,
          experience_level: userProfile.experience_level,
          gender: userProfile.gender,
          drill_id: selectedTechnique
        })
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data);
      } else {
        Alert.alert("Error", data.error || "Failed to get recommendations");
      }
    } catch (error) {
      console.error("Error fetching AR recommendations:", error);
      Alert.alert(
        "Connection Error",
        "Unable to connect to the AI service. Please make sure the ML server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Blue Gradient Header */}
      <LinearGradient colors={["#2563eb", "#1d4ed8"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>AI-Powered AR Coach</Text>
              <Text style={styles.headerSubtitle}>Personalized surfing recommendations</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Step 1: Select Technique */}
        {!showUserForm && (
          <>
            <Text style={styles.sectionTitle}>Choose Your Drill</Text>
            {techniques.map((technique) => (
              <TouchableOpacity
                key={technique.id}
                style={[
                  styles.techniqueCard,
                  selectedTechnique === technique.id && styles.techniqueCardSelected,
                ]}
                onPress={() => handleSelectTechnique(technique.id)}
              >
                <Icon
                  name={technique.icon}
                  size={40}
                  color="#007AFF"
                  style={{ marginRight: 16 }}
                />
                <View style={styles.techniqueContent}>
                  <Text style={styles.techniqueName}>{technique.name}</Text>
                  <Text style={styles.techniqueDescription}>
                    {technique.description}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#007AFF" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Step 2: User Profile Form */}
        {showUserForm && !recommendations && (
          <>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => {
                setShowUserForm(false);
                setSelectedTechnique(null);
              }}
            >
              <Icon name="edit" size={18} color="#007AFF" />
              <Text style={styles.changeButtonText}>Change Drill</Text>
            </TouchableOpacity>

            <View style={styles.selectedDrillBanner}>
              <Icon name={techniques.find(t => t.id === selectedTechnique)?.icon} size={24} color="#fff" />
              <Text style={styles.selectedDrillText}>
                {techniques.find(t => t.id === selectedTechnique)?.name}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Step 2: Your Profile</Text>
            <Text style={styles.formHelp}>
              This information helps our AI calculate the perfect surfboard setup for you
            </Text>

            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Height (cm) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 175"
                  keyboardType="numeric"
                  value={userProfile.height_cm}
                  onChangeText={(text) => setUserProfile({...userProfile, height_cm: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Weight (kg) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 70"
                  keyboardType="numeric"
                  value={userProfile.weight_kg}
                  onChangeText={(text) => setUserProfile({...userProfile, weight_kg: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 25"
                  keyboardType="numeric"
                  value={userProfile.age}
                  onChangeText={(text) => setUserProfile({...userProfile, age: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Experience Level *</Text>
                <View style={styles.experienceButtons}>
                  {['Beginner', 'Intermediate', 'Advanced', 'Pro'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.experienceButton,
                        userProfile.experience_level === level && styles.experienceButtonActive
                      ]}
                      onPress={() => setUserProfile({...userProfile, experience_level: level})}
                    >
                      <Text style={[
                        styles.experienceButtonText,
                        userProfile.experience_level === level && styles.experienceButtonTextActive
                      ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderButtons}>
                  {['Male', 'Female'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.genderButton,
                        userProfile.gender === gender && styles.genderButtonActive
                      ]}
                      onPress={() => setUserProfile({...userProfile, gender})}
                    >
                      <Text style={[
                        styles.genderButtonText,
                        userProfile.gender === gender && styles.genderButtonTextActive
                      ]}>
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleGetRecommendations}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="auto-awesome" size={24} color="#fff" style={{marginRight: 8}} />
                    <Text style={styles.submitButtonText}>Get AI Recommendations</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Step 3: Show Recommendations */}
        {recommendations && (
          <>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => {
                setRecommendations(null);
              }}
            >
              <Icon name="refresh" size={18} color="#007AFF" />
              <Text style={styles.changeButtonText}>Recalculate</Text>
            </TouchableOpacity>

            <View style={styles.successBanner}>
              <Icon name="check-circle" size={32} color="#4CAF50" />
              <Text style={styles.successTitle}>Your Personalized Setup</Text>
            </View>

            {/* Board Specifications */}
            <View style={styles.recommendationCard}>
              <View style={styles.cardHeader}>
                <Icon name="surfing" size={28} color="#007AFF" />
                <Text style={styles.cardTitle}>Surfboard Specs</Text>
              </View>
              
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>📏 Board Length:</Text>
                <Text style={styles.specValue}>{recommendations.board.length_display}</Text>
              </View>
              
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>💧 Board Volume:</Text>
                <Text style={styles.specValue}>{recommendations.board.volume_display}</Text>
              </View>
              
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>🌊 Ideal Wave Height:</Text>
                <Text style={styles.specValue}>{recommendations.wave.height_display}</Text>
              </View>

              <View style={styles.specRow}>
                <Text style={styles.specLabel}>📊 Your BMI:</Text>
                <Text style={styles.specValue}>{recommendations.surfer.bmi}</Text>
              </View>
            </View>

            {/* Coaching Tips */}
            <View style={styles.recommendationCard}>
              <View style={styles.cardHeader}>
                <Icon name="school" size={28} color="#4CAF50" />
                <Text style={styles.cardTitle}>Personalized Coaching</Text>
              </View>
              
              <View style={styles.confidenceBadge}>
                <Icon name="verified" size={16} color="#4CAF50" />
                <Text style={styles.confidenceText}>
                  {recommendations.coaching.confidence} Confidence • {recommendations.coaching.method}
                </Text>
              </View>

              {recommendations.coaching.tips.map((tip, index) => (
                <View key={index} style={styles.tipRow}>
                  <Icon 
                    name={
                      tip.type === 'equipment' ? 'build' :
                      tip.type === 'conditions' ? 'wb-sunny' : 'psychology'
                    } 
                    size={20} 
                    color="#666" 
                  />
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              ))}
            </View>

            {/* AR Placeholder */}
            <View style={styles.arPlaceholder}>
              <Icon name="view-in-ar" size={64} color="#007AFF" />
              <Text style={styles.arPlaceholderTitle}>AR View Coming Soon</Text>
              <Text style={styles.arPlaceholderText}>
                When FBX animations are ready, you'll see a 3D visualization of the{' '}
                {techniques.find(t => t.id === selectedTechnique)?.name} technique right here,{' '}
                personalized with your equipment specs!
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 8,
    marginBottom: 16,
  },
  techniqueCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  techniqueCardSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  techniqueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  techniqueContent: {
    flex: 1,
  },
  techniqueName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 3,
  },
  techniqueDescription: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: 8,
    marginBottom: 12,
  },
  changeButtonText: {
    color: "#2563eb",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "600",
  },
  selectedDrillBanner: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  selectedDrillText: {
    color: "#1e40af",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 12,
    flex: 1,
  },
  formHelp: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 14,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#f9fafb",
    color: "#1f2937",
  },
  experienceButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  experienceButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  experienceButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  experienceButtonText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  experienceButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  genderButtons: {
    flexDirection: "row",
    gap: 10,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  genderButtonText: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  genderButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  successBanner: {
    backgroundColor: "#d1fae5",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  successTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#047857",
    marginLeft: 12,
  },
  recommendationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
    marginLeft: 10,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  specLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  specValue: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "700",
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    padding: 9,
    borderRadius: 8,
    marginBottom: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: "#047857",
    marginLeft: 6,
    fontWeight: "600",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    marginLeft: 10,
    lineHeight: 20,
  },
  arPlaceholder: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 28,
    alignItems: "center",
    marginTop: 6,
    borderWidth: 2,
    borderColor: "#bfdbfe",
    borderStyle: "dashed",
  },
  arPlaceholderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e40af",
    marginTop: 14,
    marginBottom: 8,
  },
  arPlaceholderText: {
    fontSize: 13,
    color: "#3b82f6",
    textAlign: "center",
    lineHeight: 19,
  },
});
