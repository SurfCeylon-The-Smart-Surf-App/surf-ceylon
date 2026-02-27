import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ViroARSceneNavigator } from "@reactvision/react-viro";
import SurfARScene from "../components/SurfARScene";
import { AR_DEFAULTS, MODEL_MAP, POSE_BY_ID, SURF_POSES } from "../data/surfPoses";

const SCALE_MIN = 0.2;
const SCALE_MAX = 1.2;
const SCALE_STEP = 0.05;
const ROTATION_STEP = 15;

async function requestAndroidCameraPermission() {
  if (Platform.OS !== "android") return false;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: "Camera Permission",
      message: "Camera access is required to launch the AR experience.",
      buttonPositive: "Allow",
      buttonNegative: "Deny",
      buttonNeutral: "Ask Later",
    }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function ARViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [scale, setScale] = useState(AR_DEFAULTS.scale);
  const [rotationY, setRotationY] = useState(AR_DEFAULTS.rotationY);

  const pose = useMemo(() => {
    if (params.poseId && typeof params.poseId === "string") {
      return POSE_BY_ID[params.poseId] || null;
    }
    if (params.modelKey && typeof params.modelKey === "string") {
      return SURF_POSES.find((item) => item.modelKey === params.modelKey) || null;
    }
    return null;
  }, [params.modelKey, params.poseId]);

  const poseARDefaults = useMemo(() => {
    const poseDefaults = pose?.arDefaults || {};
    return {
      scale:
        typeof poseDefaults.scale === "number"
          ? poseDefaults.scale
          : AR_DEFAULTS.scale,
      position: AR_DEFAULTS.position,
      rotationY: AR_DEFAULTS.rotationY,
    };
  }, [pose]);

  const modelKey = pose?.modelKey || (typeof params.modelKey === "string" ? params.modelKey : "");
  const poseTitle = pose?.title || (typeof params.title === "string" ? params.title : "Surf Technique");
  const difficulty = pose?.difficulty || (typeof params.difficulty === "string" ? params.difficulty : "Beginner");
  const hasValidModel = !!MODEL_MAP[modelKey];

  useEffect(() => {
    setScale(poseARDefaults.scale);
    setRotationY(poseARDefaults.rotationY);
  }, [poseARDefaults.rotationY, poseARDefaults.scale]);

  useEffect(() => {
    let mounted = true;
    requestAndroidCameraPermission()
      .then((granted) => {
        if (mounted) setHasCameraPermission(granted);
      })
      .catch(() => {
        if (mounted) setHasCameraPermission(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const requestPermissionAgain = async () => {
    const granted = await requestAndroidCameraPermission();
    setHasCameraPermission(granted);
    if (!granted) {
      Alert.alert(
        "Camera Permission Required",
        "Enable camera permission in Android settings to use AR."
      );
    }
  };

  if (!hasValidModel) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Invalid AR Model</Text>
        <Text style={styles.errorText}>
          The selected technique model was not found in the app bundle.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {poseTitle}
            </Text>
            <Text style={styles.headerSubtitle}>Android ARCore - fixed placement</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.arContainer}>
        {hasCameraPermission === null ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.infoLabel}>Requesting camera permission...</Text>
          </View>
        ) : hasCameraPermission === false ? (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Camera Permission Denied</Text>
            <Text style={styles.errorText}>
              AR needs camera permission. Grant permission and try again.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={requestPermissionAgain}>
              <Text style={styles.primaryButtonText}>Grant Camera Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ViroARSceneNavigator
            autofocus={true}
            initialScene={{ scene: SurfARScene }}
            viroAppProps={{
              modelKey,
              poseTitle,
              difficulty,
              scale,
              rotationY,
              position: poseARDefaults.position,
              placementMode: "fixed",
            }}
            style={styles.viroView}
          />
        )}
      </View>

      <SafeAreaView edges={["bottom"]} style={styles.controlsSafeArea}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setRotationY((prev) => prev - ROTATION_STEP)}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.controlText}>Rotate -</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setRotationY((prev) => prev + ROTATION_STEP)}
          >
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={styles.controlText}>Rotate +</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setScale((prev) => clamp(prev - SCALE_STEP, SCALE_MIN, SCALE_MAX))}
          >
            <Ionicons name="remove" size={18} color="#fff" />
            <Text style={styles.controlText}>Scale -</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setScale((prev) => clamp(prev + SCALE_STEP, SCALE_MIN, SCALE_MAX))}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.controlText}>Scale +</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton]}
            onPress={() => {
              setScale(poseARDefaults.scale);
              setRotationY(poseARDefaults.rotationY);
            }}
          >
            <Ionicons name="refresh-circle" size={18} color="#fff" />
            <Text style={styles.controlText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.infoLabel}>{`Scale ${scale.toFixed(2)} | Rotation ${rotationY}\u00B0`}</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  headerSafeArea: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 6,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#bfdbfe",
    fontSize: 12,
    marginTop: 2,
  },
  arContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  viroView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  controlsSafeArea: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "rgba(15, 23, 42, 0.98)",
  },
  controlsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  controlButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  resetButton: {
    backgroundColor: "#64748b",
  },
  controlText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 12,
  },
  infoLabel: {
    color: "#cbd5e1",
    textAlign: "center",
    fontSize: 12,
    marginTop: 2,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0f172a",
  },
  errorTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    color: "#cbd5e1",
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
