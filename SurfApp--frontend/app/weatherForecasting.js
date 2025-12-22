import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ForecastChart from "../components/ForecastChart";
import axios from "axios";
import { getStaticApiBaseUrl } from "../utils/networkConfig";

export default function WeatherForecasting() {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [spots, setSpots] = useState([
    { id: 1, name: "Arugam Bay", region: "East Coast" },
    { id: 2, name: "Weligama", region: "South Coast" },
    { id: 3, name: "Hikkaduwa", region: "South Coast" },
    { id: 4, name: "Midigama", region: "South Coast" },
    { id: 5, name: "Hiriketiya", region: "South Coast" },
  ]);
  const router = useRouter();

  useEffect(() => {
    if (spots.length > 0) {
      setSelectedSpot(spots[0]);
      fetchForecast(spots[0].name);
    }
  }, []);

  const fetchForecast = async (spotName) => {
    try {
      setLoading(true);
      const API_URL = getStaticApiBaseUrl();
      const response = await axios.get(
        `${API_URL}/forecast/${encodeURIComponent(spotName)}`
      );

      // Transform the response data to match the expected format
      const forecastData = response.data;
      const transformedForecast = {
        dates: forecastData.labels || [],
        wave_height: forecastData.waveHeight || [],
        wave_period: forecastData.wavePeriod || [],
        wind_speed: forecastData.windSpeed || [],
        wind_direction: forecastData.windDirection || [],
        swell_height: forecastData.swellHeight || [],
        swell_period: forecastData.swellPeriod || [],
      };

      setForecast(transformedForecast);
    } catch (error) {
      console.error("Error fetching forecast:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedSpot) {
      fetchForecast(selectedSpot.name);
    }
  };

  const handleSpotChange = (spot) => {
    setSelectedSpot(spot);
    fetchForecast(spot.name);
  };

  if (loading && !forecast) {
    return (
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        className="flex-1"
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="mt-4 text-white text-base font-medium">
            Loading forecast...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View className="flex-1">
      {/* Header with gradient */}
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="pt-12 pb-4"
      >
        <SafeAreaView edges={[]} className="px-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">
              Weather Forecasting
            </Text>
            <View className="w-10" />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Spot Selector */}
      <View className="bg-white py-3 px-4 border-b border-gray-200">
        <Text className="text-sm font-semibold text-gray-600 mb-2">
          Select Spot:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {spots.map((spot) => (
            <TouchableOpacity
              key={spot.id}
              onPress={() => handleSpotChange(spot)}
              className={`px-4 py-2 mr-2 rounded-full border ${
                selectedSpot?.id === spot.id
                  ? "bg-blue-600 border-blue-600"
                  : "bg-gray-100 border-gray-200"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedSpot?.id === spot.id ? "text-white" : "text-gray-600"
                }`}
              >
                {spot.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {forecast ? (
            <View className="p-4">
              <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <Text className="text-2xl font-bold text-gray-900">
                  {selectedSpot?.name}
                </Text>
                <Text className="text-sm text-gray-600 mt-1 mb-5">
                  7-Day Forecast
                </Text>

                <ForecastChart forecast={forecast} />

                <View className="mt-6">
                  <Text className="text-lg font-semibold text-gray-900 mb-4">
                    Forecast Details
                  </Text>
                  {forecast.dates?.map((date, index) => (
                    <View
                      key={index}
                      className="flex-row justify-between py-3 border-b border-gray-100"
                    >
                      <Text className="text-sm font-semibold text-gray-900 w-20">
                        {date}
                      </Text>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-600 mb-1">
                          Wave:{" "}
                          {forecast.wave_height?.[index]?.toFixed(1) || "N/A"}m
                        </Text>
                        <Text className="text-xs text-gray-600 mb-1">
                          Wind:{" "}
                          {forecast.wind_speed?.[index]?.toFixed(0) || "N/A"}{" "}
                          km/h
                        </Text>
                        <Text className="text-xs text-gray-600">
                          Period:{" "}
                          {forecast.wave_period?.[index]?.toFixed(0) || "N/A"}s
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View className="p-12 items-center">
              <Text className="text-6xl">🌊</Text>
              <Text className="text-lg font-semibold text-gray-900 mt-4">
                No forecast available
              </Text>
              <Text className="text-sm text-gray-600 mt-2">
                Try selecting a different spot
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
