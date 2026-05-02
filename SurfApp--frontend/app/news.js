import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config/network";

export default function NewsScreen() {
  const router = useRouter();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/news`);
      const data = await response.json();
      if (data.success) {
        setNews(data.data);
      }
    } catch (e) {
      console.error("Error fetching news:", e);
    } finally {
      setLoading(false);
    }
  };

  const getCategories = () => {
    const cats = ["All", "Surfing", "Competition", "Gear", "Local"];
    // In a real app we'd extract unique categories from news, but we'll use predefined ones for UI simplicity
    return cats;
  };

  const filteredNews =
    activeCategory === "All"
      ? news
      : news.filter((item) => {
          // Simple filter based on source or content snippets matching the category somewhat closely
          if (
            item.categories &&
            item.categories.includes(activeCategory.toLowerCase())
          )
            return true;

          let target = activeCategory.toLowerCase();
          if (
            target === "competition" &&
            item.source.includes("World Surf League")
          )
            return true;

          return (
            item.title.toLowerCase().includes(target) ||
            item.contentSnippet.toLowerCase().includes(target)
          );
        });

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const renderNewsItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => (item.link ? Linking.openURL(item.link) : null)}
      className="bg-white mx-4 my-2 rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {item.image && (
        <Image
          source={{ uri: item.image }}
          className="w-full h-40"
          resizeMode="cover"
        />
      )}
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-blue-700 text-xs font-medium">
              {item.source}
            </Text>
          </View>
          <Text className="text-gray-500 text-xs">
            {formatTimeAgo(item.pubDate)}
          </Text>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-2 leading-tight">
          {item.title}
        </Text>
        <Text
          className="text-gray-600 text-sm mb-3 leading-5"
          numberOfLines={3}
        >
          {item.contentSnippet}
        </Text>

        <View className="flex-row items-center border-t border-gray-100 pt-3">
          <Text className="text-blue-600 font-medium text-xs mr-1">
            Read full article
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#2563eb" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">Surf News</Text>
      </View>

      {/* Categories */}
      <View className="bg-white pb-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={getCategories()}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveCategory(item)}
              className={`px-4 py-2 rounded-full mr-2 ${
                activeCategory === item ? "bg-blue-600" : "bg-gray-100"
              }`}
            >
              <Text
                className={`font-medium ${
                  activeCategory === item ? "text-white" : "text-gray-600"
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* News List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-4 text-gray-500">
            Fetching latest surf news...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNews}
          renderItem={renderNewsItem}
          keyExtractor={(item, index) => item.link || index.toString()}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="p-8 items-center">
              <Ionicons name="newspaper-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-500 text-center mt-4 font-medium">
                No news found for this category
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
