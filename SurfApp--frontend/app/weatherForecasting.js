import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// Retired screen stub to avoid dead navigation targets.
export default function WeatherForecasting() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
      <Text className="text-lg font-bold text-gray-900 mb-2">
        Weather Forecasting has moved
      </Text>
      <Text className="text-sm text-gray-600 text-center mb-4">
        This screen is no longer available. Please use spot details or the map
        popup to view forecasts.
      </Text>
      <TouchableOpacity
        onPress={() => router.back()}
        className="px-4 py-2 bg-blue-600 rounded-lg"
      >
        <Text className="text-white font-semibold">Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
