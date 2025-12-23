import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useUser } from "../context/UserContext";

const SpotCard = ({ spot, testID, origin }) => {
  const router = useRouter();
  const { setSelectedSpot } = useUser();

  const waveHeight = spot?.forecast?.waveHeight ?? "?";
  const wavePeriod = spot?.forecast?.wavePeriod ?? "?";
  const windSpeed = spot?.forecast?.windSpeed ?? "?";
  const windDirection = spot?.forecast?.windDirection ?? "?";
  const tideStatus = spot?.forecast?.tide?.status ?? "-";

  // Use spot.score (number) for calculations, spot.suitability (string) for label
  const score =
    typeof spot?.score === "number" && !isNaN(spot.score) ? spot.score : 0;
  const suitabilityLabel = spot?.suitability || "Unknown";

  // Enhanced breakdown data (Phase 1)
  const breakdown = spot?.breakdown || {};
  const canSurf = spot?.canSurf !== undefined ? spot.canSurf : true;

  const handlePress = () => {
    setSelectedSpot(spot);
    router.push({ pathname: "/(spots)/detail", params: { origin } });
  };
  // Debug logging
  if (spot?.name === "Midigama") {
    console.log(
      "Midigama card - distance:",
      spot.distance,
      "type:",
      typeof spot.distance
    );
  }

  // Determine color based on score
  const getGradientColors = () => {
    if (score >= 75) return ["#4ade80", "#22c55e"]; // Green
    if (score >= 50) return ["#fbbf24", "#f59e0b"]; // Yellow/Orange
    if (score >= 25) return ["#fb923c", "#f97316"]; // Orange
    return ["#f87171", "#ef4444"]; // Red
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white my-2 mx-4 rounded-2xl shadow-md active:opacity-90 active:scale-98 overflow-hidden"
      accessibilityRole="button"
      accessibilityLabel={`Open details for ${spot?.name}`}
      testID={testID}
    >
      <View className="p-4">
        {/* Header Section */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {spot?.name}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-600">{spot?.region}</Text>
              {spot?.distance !== undefined && spot?.distance !== null && (
                <Text className="text-xs text-blue-600 font-semibold ml-2">
                  • {spot.distance}km away
                </Text>
              )}
            </View>
          </View>

          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-3 py-2 rounded-xl items-center justify-center min-w-[90px] shadow-sm"
          >
            <Text className="text-[10px] text-white font-bold uppercase tracking-wide mb-0.5">
              {suitabilityLabel}
            </Text>
            <Text className="text-[22px] font-bold text-white leading-6">
              {Math.round(score)}%
            </Text>
            {!canSurf && <Text className="text-xs mt-0.5">⚠️</Text>}
          </LinearGradient>
        </View>

        {/* Forecast Details Grid */}
        <View className="flex-row flex-wrap mt-2">
          <View className="w-1/2 flex-row items-center mb-3">
            <Text className="text-2xl mr-2.5">🌊</Text>
            <View>
              <Text className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                Wave
              </Text>
              <Text className="text-sm text-gray-800 font-semibold mt-0.5">
                {waveHeight}m @ {wavePeriod}s
              </Text>
            </View>
          </View>

          <View className="w-1/2 flex-row items-center mb-3">
            <Text className="text-2xl mr-2.5">💨</Text>
            <View>
              <Text className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                Wind
              </Text>
              <Text className="text-sm text-gray-800 font-semibold mt-0.5">
                {windSpeed} kph
              </Text>
            </View>
          </View>

          <View className="w-1/2 flex-row items-center mb-3">
            <Text className="text-2xl mr-2.5">🧭</Text>
            <View>
              <Text className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                Direction
              </Text>
              <Text className="text-sm text-gray-800 font-semibold mt-0.5">
                {windDirection}°
              </Text>
            </View>
          </View>

          <View className="w-1/2 flex-row items-center mb-3">
            <Text className="text-2xl mr-2.5">🌙</Text>
            <View>
              <Text className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                Tide
              </Text>
              <Text className="text-sm text-gray-800 font-semibold mt-0.5">
                {tideStatus}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SpotCard;
