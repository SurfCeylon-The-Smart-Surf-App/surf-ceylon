import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// @ts-ignore
import Icon from "react-native-vector-icons/MaterialIcons";

const techniques = [
  {
    id: "catch-wave",
    name: "Catching a Wave",
    description: "Learn the timing and positioning for catching waves",
    icon: "waves",
  },
  {
    id: "pop-up",
    name: "Pop-Up",
    description: "Master the pop-up technique to get on your board",
    icon: "sports-surfing",
  },
  {
    id: "turning",
    name: "Turning",
    description: "Learn how to turn and maneuver on the wave",
    icon: "rotate-right",
  },
  {
    id: "bottom-turn",
    name: "Bottom Turn",
    description: "Essential technique for setting up your ride",
    icon: "arrow-downward",
  },
  {
    id: "cutback",
    name: "Cutback",
    description: "Advanced maneuver to stay in the wave",
    icon: "swap-horiz",
  },
];

export default function ARVisualizationScreen() {
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const { useRouter } = require("expo-router");
  const router = useRouter();

  const handleViewTechnique = (techniqueId) => {
    setSelectedTechnique(techniqueId);
    // TODO: Integrate AR view here when FBX models are ready
    Alert.alert(
      "AR Visualization",
      "AR visualization will be available once FBX models are integrated. For now, you can practice the technique using the Pose Practice feature.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>AR Visualization</Text>
        <Text style={styles.subtitle}>
          Choose a surfing technique to visualize in AR
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Note: FBX animation models are still being created. AR visualization
            will be available soon.
          </Text>
        </View>

        {techniques.map((technique) => (
          <TouchableOpacity
            key={technique.id}
            style={[
              styles.techniqueCard,
              selectedTechnique === technique.id &&
                styles.techniqueCardSelected,
            ]}
            onPress={() => handleViewTechnique(technique.id)}
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
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderTitle}>AR View Placeholder</Text>
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              When FBX models are ready, the AR view will appear here showing
              the selected technique in your environment.
            </Text>
            <Text style={styles.placeholderText}>You'll be able to:</Text>
            <Text style={styles.placeholderBullet}>
              • See 3D animations of the technique
            </Text>
            <Text style={styles.placeholderBullet}>
              • View from different angles
            </Text>
            <Text style={styles.placeholderBullet}>
              • Understand timing and motion
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  infoText: {
    fontSize: 14,
    color: "#856404",
  },
  techniqueCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  techniqueCardSelected: {
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  techniqueContent: {
    flex: 1,
  },
  techniqueName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  techniqueDescription: {
    fontSize: 14,
    color: "#666",
  },
  arrow: {
    fontSize: 20,
    color: "#007AFF",
    marginLeft: 8,
  },
  placeholderContainer: {
    marginTop: 20,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  placeholderBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  placeholderText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  placeholderBullet: {
    fontSize: 14,
    color: "#666",
    marginLeft: 16,
    marginBottom: 4,
    lineHeight: 20,
  },
});
