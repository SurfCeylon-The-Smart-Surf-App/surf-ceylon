import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SpotCard from "../components/SpotCard";
import axios from "axios";
import { getStaticApiBaseUrl } from "../utils/networkConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../context/UserContext";
import { filterSpotsByRadius, addDistanceToSpots } from "../data/locationUtils";

export default function SpotRecommender() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const router = useRouter();
  const { userLocation } = useUser();

  useEffect(() => {
    fetchSpots();
  }, [userLocation]); // Re-fetch when location changes

  const fetchSpots = async () => {
    try {
      setLoading(true);

      // Get user preferences from storage
      const userData = await AsyncStorage.getItem("userData");
      const user = userData ? JSON.parse(userData) : null;

      const params = {
        skillLevel: user?.skillLevel || "Intermediate",
        preferredWaveHeight: user?.preferences?.preferredWaveHeight || 1.5,
        preferredWindSpeed: user?.preferences?.preferredWindSpeed || 15,
        minWaveHeight: user?.preferences?.minWaveHeight || 0.5,
        maxWaveHeight: user?.preferences?.maxWaveHeight || 2.5,
        boardType: user?.preferences?.boardType || "Soft-top",
        tidePreference: user?.preferences?.tidePreference || "Any",
        userId: user?._id || user?.id,
      };

      const API_URL = getStaticApiBaseUrl();
      const response = await axios.get(`${API_URL}/spots`, { params });

      let fetchedSpots = response.data.spots || [];

      // Filter spots within 10km radius if location is available
      if (userLocation) {
        console.log(
          "Filtering spots within 10km radius from user location:",
          userLocation
        );
        fetchedSpots = filterSpotsByRadius(fetchedSpots, userLocation, 10);
        // Add distance information to each spot
        fetchedSpots = addDistanceToSpots(fetchedSpots, userLocation);
        // Sort by distance (closest first) within same score category
        fetchedSpots.sort((a, b) => {
          if (Math.abs(a.score - b.score) < 5) {
            // If scores are similar (within 5 points), sort by distance
            return (a.distance || 999) - (b.distance || 999);
          }
          return b.score - a.score;
        });
        console.log(`Found ${fetchedSpots.length} spots within 10km radius`);
      } else {
        console.log("User location not available, showing all spots");
      }

      setSpots(fetchedSpots);
    } catch (error) {
      console.error("Error fetching spots:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSpots();
  };

  const getFilteredSpots = () => {
    if (filter === "all") return spots;
    if (filter === "excellent") return spots.filter((s) => s.score >= 75);
    if (filter === "good")
      return spots.filter((s) => s.score >= 50 && s.score < 75);
    if (filter === "fair") return spots.filter((s) => s.score < 50);
    return spots;
  };

  const filteredSpots = getFilteredSpots();

  if (loading) {
    return (
      <LinearGradient colors={["#2563eb", "#1d4ed8"]} className="flex-1">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="mt-4 text-white text-base font-medium">
            Loading surf spots...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  const FilterButton = ({ label, value, count }) => (
    <TouchableOpacity
      onPress={() => setFilter(value)}
      className={`flex-row items-center px-4 py-2 mr-3 rounded-full border ${
        filter === value
          ? "bg-blue-600 border-blue-600"
          : "bg-gray-100 border-gray-200"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          filter === value ? "text-white" : "text-gray-600"
        }`}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          className={`ml-2 rounded-full px-2 py-0.5 ${
            filter === value ? "bg-white/30" : "bg-gray-200"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              filter === value ? "text-white" : "text-gray-600"
            }`}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      {/* Header with gradient */}
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={["top"]} className="px-4 pb-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">
              Spot Recommender
            </Text>
            <View className="w-10" />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Filters */}
      <View className="bg-white py-3 border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <FilterButton label="All Spots" value="all" count={spots.length} />
          <FilterButton
            label="Excellent"
            value="excellent"
            count={spots.filter((s) => s.score >= 75).length}
          />
          <FilterButton
            label="Good"
            value="good"
            count={spots.filter((s) => s.score >= 50 && s.score < 75).length}
          />
          <FilterButton
            label="Fair"
            value="fair"
            count={spots.filter((s) => s.score < 50).length}
          />
        </ScrollView>

        {/* Location info */}
        {userLocation && spots.length > 0 && (
          <View className="px-4 pt-2">
            <View className="flex-row items-center">
              <Ionicons name="location" size={14} color="#6b7280" />
              <Text className="text-xs text-gray-600 ml-1">
                Showing spots within 10km of your location
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredSpots.length === 0 ? (
            <View className="p-12 items-center">
              <Text className="text-6xl">🏄‍♂️</Text>
              <Text className="text-lg font-semibold text-gray-900 mt-4">
                No spots in this category
              </Text>
              <Text className="text-sm text-gray-600 mt-2">
                Try a different filter
              </Text>
            </View>
          ) : (
            filteredSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} origin="dashboard" />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}
