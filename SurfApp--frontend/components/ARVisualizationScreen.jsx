import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
// @ts-ignore
import Icon from "react-native-vector-icons/MaterialIcons";
import { API_BASE_URL } from "../constants/config";
import { TECHNIQUE_INSTRUCTIONS } from "../data/techniqueInstructions";
import { useSurfTutorProfile } from "../context/SurfTutorProfileContext.jsx";

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
    icon: "surfing",
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
  const router = useRouter();
  const { profile, clearProfile } = useSurfTutorProfile();
  
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);

  // Map technique IDs to model keys for AR viewer
  const techniqueToModelKey = {
    "paddling-technique": "paddling",
    "pop-up": "pop_up",
    "surfing-stance": "stance_balance",
    "safely-falling": "safely_falling",
    "bottom-turn": "bottom_turn",
    "generating-speed": "generating_speed",
    "cutback": "cutback",
    "tube-riding": "tube_riding_stance",
    "catching-whitewater": "catching_whitewater",
    "catching-green-waves": "catching_green_waves",
    "trimming-angling": "trimming_angling",
    "floater": "floater",
    "re-entry-snap": "re_entry_snap",
    "roundhouse-cutback": "roundhouse_cutback",
    "aerial": "air_aerial",
  };

  const handleSelectTechnique = (techniqueId) => {
    setSelectedTechnique(techniqueId);
    setRecommendations(null);
    // Auto-fetch recommendations using profile data
    handleGetRecommendations(techniqueId);
  };

  const handleGetRecommendations = async (techniqueId = selectedTechnique) => {
    if (!profile) {
      Alert.alert("Profile Required", "Please complete your profile first");
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
          height_cm: profile.height,
          weight_kg: profile.weight,
          age: profile.age,
          experience_level: profile.experienceLevel,
          gender: profile.gender,
          drill_id: techniqueId
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

  const handleLaunchAR = () => {
    const modelKey = techniqueToModelKey[selectedTechnique];
    const technique = techniques.find(t => t.id === selectedTechnique);
    
    if (!modelKey || !technique) {
      Alert.alert("Error", "Invalid technique selected");
      return;
    }

    router.push({
      pathname: "/arViewer",
      params: {
        modelKey: modelKey,
        title: technique.name,
        difficulty: profile?.experienceLevel || 'Beginner',
      },
    });
  };

  // Helper to render profile summary
  const renderProfileSummary = () => {
    if (!profile) return null;
    
    return (
      <View style={styles.profileSummaryCard}>
        <View style={styles.profileSummaryHeader}>
          <Icon name="person" size={24} color="#2563eb" />
          <Text style={styles.profileSummaryTitle}>Your Profile</Text>
          <TouchableOpacity
            onPress={async () => {
              await clearProfile();
              router.push("/aiSurfTutor");
            }}
            style={styles.profileEditButton}
          >
            <Icon name="edit" size={16} color="#2563eb" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileSummaryGrid}>
          <View style={styles.profileSummaryItem}>
            <Text style={styles.profileSummaryLabel}>Experience</Text>
            <Text style={styles.profileSummaryValue}>{profile.experienceLevel}</Text>
          </View>
          <View style={styles.profileSummaryItem}>
            <Text style={styles.profileSummaryLabel}>Height</Text>
            <Text style={styles.profileSummaryValue}>{profile.height} cm</Text>
          </View>
          <View style={styles.profileSummaryItem}>
            <Text style={styles.profileSummaryLabel}>Weight</Text>
            <Text style={styles.profileSummaryValue}>{profile.weight} kg</Text>
          </View>
          <View style={styles.profileSummaryItem}>
            <Text style={styles.profileSummaryLabel}>Age</Text>
            <Text style={styles.profileSummaryValue}>{profile.age} yrs</Text>
          </View>
        </View>
      </View>
    );
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
            <TouchableOpacity
              style={styles.editButton}
              onPress={async () => {
                await clearProfile();
                router.push("/aiSurfTutor");
              }}
            >
              <Icon name="edit" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Summary */}
        {renderProfileSummary()}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Getting AI Recommendations...</Text>
          </View>
        )}

        {/* Technique Selection */}
        {!selectedTechnique && !loading && (
          <>
            <Text style={styles.sectionTitle}>Choose Your Drill</Text>
            {techniques.map((technique) => (
              <TouchableOpacity
                key={technique.id}
                style={styles.techniqueCard}
                onPress={() => handleSelectTechnique(technique.id)}
              >
                <Icon
                  name={technique.icon}
                  size={40}
                  color="#2563eb"
                  style={{ marginRight: 16 }}
                />
                <View style={styles.techniqueContent}>
                  <Text style={styles.techniqueName}>{technique.name}</Text>
                  <Text style={styles.techniqueDescription}>
                    {technique.description}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#2563eb" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Show Recommendations */}
        {recommendations && selectedTechnique && !loading && (
          <>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => {
                setRecommendations(null);
                setSelectedTechnique(null);
              }}
            >
              <Icon name="arrow-back" size={18} color="#2563eb" />
              <Text style={styles.changeButtonText}>Choose Different Drill</Text>
            </TouchableOpacity>

            <View style={styles.selectedDrillBanner}>
              <Icon name={techniques.find(t => t.id === selectedTechnique)?.icon} size={28} color="#1e40af" />
              <Text style={styles.selectedDrillText}>
                {techniques.find(t => t.id === selectedTechnique)?.name}
              </Text>
            </View>

            <View style={styles.successBanner}>
              <Icon name="check-circle" size={32} color="#10b981" />
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

            {/* Technique Instructions */}
            {TECHNIQUE_INSTRUCTIONS[selectedTechnique] && (
              <View style={styles.instructionsContainer}>
                <TouchableOpacity 
                  style={styles.instructionsHeader}
                  onPress={() => setInstructionsExpanded(!instructionsExpanded)}
                  activeOpacity={0.7}
                >
                  <Icon name="description" size={24} color="#2563eb" />
                  <Text style={styles.instructionsHeaderText}>
                    📋 Technique Instructions
                  </Text>
                  <Icon 
                    name={instructionsExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                    size={28} 
                    color="#2563eb" 
                  />
                </TouchableOpacity>

                {instructionsExpanded && (
                  <View style={styles.instructionsContent}>
                    <Text style={styles.instructionsSubtitle}>
                      Follow these steps to master this technique:
                    </Text>

                    {TECHNIQUE_INSTRUCTIONS[selectedTechnique].steps.map((step, index) => (
                      <View key={index} style={styles.stepItem}>
                        <View style={styles.stepNumberBadge}>
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}

                    <View style={styles.proTipBox}>
                      <View style={styles.proTipHeader}>
                        <Icon name="lightbulb" size={20} color="#047857" />
                        <Text style={styles.proTipTitle}>Pro Tip</Text>
                      </View>
                      <Text style={styles.proTipText}>
                        {TECHNIQUE_INSTRUCTIONS[selectedTechnique].proTip}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* AR Visualization Button */}
            <TouchableOpacity 
              style={styles.arLaunchButton}
              onPress={handleLaunchAR}
              activeOpacity={0.8}
            >
              <View style={styles.arButtonContent}>
                <Icon name="view-in-ar" size={48} color="#fff" />
                <Text style={styles.arButtonTitle}>Launch AR Visualization</Text>
                <Text style={styles.arButtonSubtitle}>
                  View 3D model of {techniques.find(t => t.id === selectedTechnique)?.name} in AR
                </Text>
              </View>
            </TouchableOpacity>
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
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
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
  arLaunchButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 24,
    marginTop: 6,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  arButtonContent: {
    alignItems: "center",
  },
  arButtonTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginTop: 12,
    marginBottom: 6,
  },
  arButtonSubtitle: {
    fontSize: 13,
    color: "#bfdbfe",
    textAlign: "center",
    lineHeight: 19,
  },
  instructionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#eff6ff",
    borderBottomWidth: 1,
    borderBottomColor: "#bfdbfe",
  },
  instructionsHeaderText: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#1e40af",
    marginLeft: 10,
  },
  instructionsContent: {
    padding: 16,
  },
  instructionsSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
    fontWeight: "500",
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 21,
  },
  proTipBox: {
    backgroundColor: "#d1fae5",
    borderRadius: 10,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  proTipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  proTipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#047857",
    marginLeft: 8,
  },
  proTipText: {
    fontSize: 14,
    color: "#065f46",
    lineHeight: 20,
  },
  profileSummaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  profileSummaryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
    marginLeft: 10,
    flex: 1,
  },
  profileEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  profileSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  profileSummaryItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
  },
  profileSummaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  profileSummaryValue: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
    marginTop: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
});
