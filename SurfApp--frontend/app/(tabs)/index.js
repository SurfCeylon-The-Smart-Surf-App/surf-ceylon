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

export default function HomeScreen() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { userPreferences, userLocation, userId } = useUser();

  useEffect(() => {
    fetchSpots();
  }, [userPreferences, userLocation]);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      let data = await getSpotsData(userPreferences, userLocation, userId);

      // Filter spots within 10km radius if location is available
      if (userLocation) {
        data = filterSpotsByRadius(data, userLocation, 10);
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
            <View className="flex-row justify-between items-center px-6 mb-4">
              <View>
                <Text className="text-xl font-bold text-gray-900">
                  Top Spots For You
                </Text>
                <Text className="text-sm text-gray-500 mt-0.5">
                  Based on current conditions & your preferences
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/spotRecommender")}>
                <Text className="text-blue-600 font-medium">View All</Text>
              </TouchableOpacity>
            </View>

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
              </View>
            ) : (
              <View className="mx-6 bg-white rounded-lg p-6 items-center">
                <Ionicons name="location-outline" size={40} color="#9ca3af" />
                <Text className="text-gray-600 text-center mt-2">
                  No spots available right now
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
