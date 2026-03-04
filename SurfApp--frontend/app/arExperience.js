import React from "react";
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { SURF_POSES } from "../data/surfPoses";

const DIFFICULTY_COLORS = {
  Beginner: { bg: "#d1fae5", text: "#047857" },
  Intermediate: { bg: "#fef3c7", text: "#92400e" },
  Advanced: { bg: "#fce7f3", text: "#9d174d" },
};

export default function ARExperienceScreen() {
  const router = useRouter();

  const handlePosePress = (pose) => {
    router.push({
      pathname: "/arViewer",
      params: {
        poseId: pose.id,
        modelKey: pose.modelKey,
        title: pose.title,
        difficulty: pose.difficulty,
      },
    });
  };

  const renderPoseCard = ({ item, index }) => {
    const difficultyStyle =
      DIFFICULTY_COLORS[item.difficulty] || DIFFICULTY_COLORS.Beginner;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePosePress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardRow}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{index + 1}</Text>
          </View>

          <View style={styles.iconContainer}>
            <Icon name={item.icon} size={30} color="#2563eb" />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyStyle.bg }]}>
              <Text style={[styles.difficultyText, { color: difficultyStyle.text }]}>
                {item.difficulty}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={["#2563eb", "#1d4ed8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>AR Experience</Text>
              <Text style={styles.headerSubtitle}>
                Select one of 15 surfing techniques to open AR
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.infoBanner}>
        <Icon name="view-in-ar" size={20} color="#2563eb" />
        <Text style={styles.infoText}>
          Tap a technique to load the corresponding local 3D model in AR
        </Text>
      </View>

      <FlatList
        data={SURF_POSES}
        renderItem={renderPoseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerSafeArea: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
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
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  infoText: {
    fontSize: 13,
    color: "#1e40af",
    marginLeft: 10,
    flex: 1,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  numberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 3,
  },
  cardDescription: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
    marginBottom: 6,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

