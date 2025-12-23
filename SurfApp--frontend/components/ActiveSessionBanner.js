import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";

const ActiveSessionBanner = () => {
  const router = useRouter();
  const {
    activeSessionId,
    activeSessionSpot,
    activeSessionStartTime,
    setSelectedSpot,
  } = useUser();
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!activeSessionStartTime) {
      // If no start time, show 0s as default
      setElapsed("0s");
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeSessionStartTime);
      const now = new Date();
      const diffMs = now - start;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (hours > 0) {
        setElapsed(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setElapsed(`${minutes}m ${seconds}s`);
      } else {
        setElapsed(`${seconds}s`);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeSessionStartTime]);

  if (!activeSessionId || !activeSessionSpot) {
    return null;
  }

  const handleBannerPress = () => {
    // Set the selected spot so the detail page can access it
    setSelectedSpot(activeSessionSpot);
    // Navigate to the spot detail page and scroll to session button
    router.push(`/(spots)/detail?origin=banner&scrollToSession=true`);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.bannerWrapper}>
      <TouchableOpacity
        style={styles.banner}
        onPress={handleBannerPress}
        activeOpacity={0.8}
      >
        <View style={styles.bannerContent}>
          <Ionicons
            name="recording"
            size={16}
            color="#fff"
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            <Text style={styles.bannerText}>
              Session at {activeSessionSpot.name}
            </Text>
            <Text style={styles.timerText}>⏱️ {elapsed}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#fff"
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bannerWrapper: {
    backgroundColor: "#dc2626",
  },
  banner: {
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#b91c1c",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  bannerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  timerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default ActiveSessionBanner;
