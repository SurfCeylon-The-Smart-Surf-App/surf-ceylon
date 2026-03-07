import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SpotCard from "../../components/SpotCard";
import { useUser } from "../../context/UserContext";
import { getSpotsData } from "../../data/surfApi";
import { filterSpotsByRadius } from "../../data/locationUtils";
import { dummyNews } from "../../constants/dummyData";

const REGIONS = [
  "Near Me",
  "South Coast",
  "West Coast",
  "East Coast",
  "North Coast",
  "North-West Coast",
];

export default function HomeScreen() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("Near Me");
  const router = useRouter();
  const { userPreferences, userLocation, userId } = useUser();

  useEffect(() => {
    fetchSpots();
  }, [userPreferences, userLocation, selectedRegion]);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      let data = await getSpotsData(userPreferences, userLocation, userId);

      if (selectedRegion === "Near Me") {
        // Filter spots within 20km radius if location is available
        if (userLocation) {
          data = filterSpotsByRadius(data, userLocation, 20);
        }
      } else {
        // Filter by selected region
        data = data.filter(
          (spot) =>
            spot.region &&
            spot.region.toLowerCase() === selectedRegion.toLowerCase(),
        );
      }

      // Get top 3 spots for home screen
      setSpots(data.slice(0, 3));
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

  const renderNewsCard = ({ item }) => (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-3">
        <View className="bg-blue-100 px-2 py-1 rounded">
          <Text className="text-blue-700 text-xs font-medium">
            {item.category}
          </Text>
        </View>
        <Text className="text-gray-500 text-xs">{item.timeAgo}</Text>
      </View>

      <Text className="text-lg font-semibold text-gray-900 mb-2">
        {item.title}
      </Text>
      <Text className="text-gray-600 text-sm mb-3 leading-5">
        {item.description}
      </Text>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <View className="w-6 h-6 bg-gray-300 rounded-full mr-2" />
          <Text className="text-gray-600 text-xs">{item.source}</Text>
        </View>
        <Text className="text-gray-500 text-xs">{item.readTime}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      {/* Header with gradient extending to notch */}
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={["top"]} className="px-6 pb-4">
          <Text className="text-white text-2xl font-bold">Surf Ceylon</Text>
          <Text className="text-blue-100 text-sm">
            Your personalized surf recommendations
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 bg-gray-50">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Top Surf Spots Recommendations */}
          <View className="py-6">
            <View className="flex-row justify-between items-center px-6 mb-3">
              <View>
                <Text className="text-xl font-bold text-gray-900">
                  Top Spots For You
                </Text>
                <Text className="text-sm text-gray-500 mt-0.5">
                  Based on current conditions & your preferences
                </Text>
              </View>
            </View>

            {/* Near Me radius hint */}
            {selectedRegion === "Near Me" && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingBottom: 6,
                }}
              >
                <Ionicons name="radio-button-on" size={12} color="#2563eb" />
                <Text style={{ fontSize: 12, color: "#2563eb", marginLeft: 4 }}>
                  Showing surf spots within 20km of your location
                </Text>
              </View>
            )}

            {/* Location / Region selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 8,
              }}
            >
              {REGIONS.map((region) => {
                const isActive = selectedRegion === region;
                return (
                  <TouchableOpacity
                    key={region}
                    onPress={() => setSelectedRegion(region)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 20,
                      marginRight: 8,
                      backgroundColor: isActive ? "#2563eb" : "#ffffff",
                      borderWidth: 1,
                      borderColor: isActive ? "#2563eb" : "#d1d5db",
                    }}
                  >
                    {region === "Near Me" && (
                      <Ionicons
                        name="location"
                        size={13}
                        color={isActive ? "#ffffff" : "#6b7280"}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? "600" : "400",
                        color: isActive ? "#ffffff" : "#374151",
                      }}
                    >
                      {region}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {loading ? (
              <View className="h-40 justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="mt-2 text-gray-500">Loading spots...</Text>
              </View>
            ) : spots.length > 0 ? (
              <View className="px-2">
                {spots.map((spot) => (
                  <SpotCard key={spot.id} spot={spot} origin="home" />
                ))}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/spotRecommender",
                      params: { region: selectedRegion },
                    })
                  }
                  style={{
                    marginHorizontal: 8,
                    marginTop: 4,
                    marginBottom: 8,
                    paddingVertical: 12,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: "#2563eb",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#2563eb",
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    View All Spots
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="mx-6 bg-white rounded-lg p-6 items-center">
                <Ionicons name="location-outline" size={40} color="#9ca3af" />
                <Text className="text-gray-600 text-center mt-2">
                  {selectedRegion === "Near Me"
                    ? "No spots found within 20km of your location"
                    : `No spots found for ${selectedRegion}`}
                </Text>
              </View>
            )}
          </View>

          {/* Featured Stories */}
          <View className="px-6 py-2">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Featured Stories
            </Text>

            <FlatList
              data={dummyNews}
              renderItem={renderNewsCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>

          {/* Latest Updates */}
          <View className="px-6 py-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Latest Updates
              </Text>
              <TouchableOpacity>
                <Text className="text-blue-600 font-medium">See All</Text>
              </TouchableOpacity>
            </View>

            {/* Placeholder for latest updates */}
            <View className="bg-white rounded-lg p-4 border border-gray-100">
              <Text className="text-gray-600 text-center py-8">
                More updates coming soon...
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
