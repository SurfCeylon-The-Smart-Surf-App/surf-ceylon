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
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SpotCard from "../../components/SpotCard";
import { useUser } from "../../context/UserContext";
import { getSpotsData } from "../../data/surfApi";
import { filterSpotsByRadius } from "../../data/locationUtils";
import { API_BASE_URL } from "../../config/network";
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
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("Near Me");
  const router = useRouter();
  const { userPreferences, userLocation, userId } = useUser();

  useEffect(() => {
    fetchSpots();
    fetchNews();
  }, [userPreferences, userLocation, selectedRegion]);

  const fetchNews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/news`);
      const data = await response.json();
      if (data.success && data.data) {
        setNews(data.data.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    }
  };

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
    fetchNews();
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const renderNewsCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => (item.link ? Linking.openURL(item.link) : null)}
      className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="bg-blue-100 px-2 py-1 rounded">
          <Text className="text-blue-700 text-xs font-medium">
            {item.categories && item.categories.length > 0
              ? item.categories[0]
              : item.category || "News"}
          </Text>
        </View>
        <Text className="text-gray-500 text-xs">
          {formatTimeAgo(item.pubDate) || item.timeAgo}
        </Text>
      </View>

      <View className="flex-row justify-between mb-3">
        <View className="flex-1 pr-3">
          <Text className="text-lg font-semibold text-gray-900 mb-1 leading-snug">
            {item.title}
          </Text>
          <Text className="text-gray-600 text-sm leading-5" numberOfLines={2}>
            {item.contentSnippet || item.description}
          </Text>
        </View>

        {item.image && (
          <Image
            source={{ uri: item.image }}
            className="w-20 h-20 rounded-md bg-gray-100"
            resizeMode="cover"
          />
        )}
      </View>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <View className="bg-gray-200 rounded px-2 py-0.5 mr-2">
            <Text className="text-gray-600 text-xs">{item.source}</Text>
          </View>
        </View>
        <Text className="text-blue-500 font-medium text-xs">Read more</Text>
      </View>
    </TouchableOpacity>
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
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Featured Stories
              </Text>
              <TouchableOpacity onPress={() => router.push("/news")}>
                <Text className="text-blue-600 font-medium">More News</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={news.length > 0 ? news : dummyNews}
              renderItem={renderNewsCard}
              keyExtractor={(item, index) =>
                item.link ? item.link : index.toString()
              }
              scrollEnabled={false}
            />

            <TouchableOpacity
              onPress={() => router.push("/news")}
              style={{
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
                View All News
              </Text>
            </TouchableOpacity>
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
