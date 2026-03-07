import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Pressable,
  ScrollView,
  Share,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useUser } from "../../context/UserContext";
import { getSpotsData } from "../../data/surfApi";
import ForecastChart from "../../components/ForecastChart";

const MapScreen = () => {
  const { userPreferences, userLocation, user, userId } = useUser();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchAndSetSpots = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSpotsData(userPreferences, userLocation, userId);

        const validSpots = data
          .filter((spot) => {
            if (
              !spot.coords ||
              !Array.isArray(spot.coords) ||
              spot.coords.length !== 2
            )
              return false;
            const lon = parseFloat(spot.coords[0]);
            const lat = parseFloat(spot.coords[1]);
            return !isNaN(lon) && !isNaN(lat) && isFinite(lon) && isFinite(lat);
          })
          .map((spot) => ({
            ...spot,
            score: parseFloat(spot.score) || 0,
            coords: [parseFloat(spot.coords[0]), parseFloat(spot.coords[1])],
          }));

        setSpots(validSpots);
      } catch (error) {
        console.error("Error fetching spots for map:", error);
        setError("Failed to load spot data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAndSetSpots();
  }, [userPreferences, userLocation]);

  const getMarkerColor = (suitability) => {
    if (suitability > 75) return "#10b981";
    if (suitability > 50) return "#f59e0b";
    if (suitability > 25) return "#f97316";
    return "#ef4444";
  };

  const handleMarkerPress = (spot) => {
    setSelectedSpot(spot);
    // Animate camera to selected spot
    const lat = parseFloat(spot.coords[1]);
    const lon = parseFloat(spot.coords[0]);

    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      1000,
    );
  };

  const handleShare = async () => {
    if (!selectedSpot) return;
    try {
      await Share.share({
        message: `Check out this surf spot: ${selectedSpot.name} in ${selectedSpot.region}! `,
        url: `https://www.google.com/maps/search/?api=1&query=${selectedSpot.coords[1]},${selectedSpot.coords[0]}`,
        title: `Surf Spot: ${selectedSpot.name}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleDirections = () => {
    if (!selectedSpot) return;
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${selectedSpot.coords[1]},${selectedSpot.coords[0]}`;
    const label = selectedSpot.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.coords[1]},${selectedSpot.coords[0]}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        return Linking.openURL(googleMapsUrl);
      }
    });
  };

  const handleMyLocation = () => {
    if (userLocation && mapRef.current) {
      const lat = parseFloat(userLocation.latitude);
      const lon = parseFloat(userLocation.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        mapRef.current.animateToRegion(
          {
            latitude: lat,
            longitude: lon,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          1000,
        );
      }
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading surf spots...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {!user && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestBannerText}>
            Showing suitability for Beginner level (Default)
          </Text>
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={true}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: 7.8731,
          longitude: 80.7718,
          latitudeDelta: 2,
          longitudeDelta: 2,
        }}
      >
        {spots.map((spot) => {
          const isSelected = selectedSpot?.id === spot.id;
          const color = getMarkerColor(spot.score);

          return (
            <Marker
              key={spot.id}
              coordinate={{
                latitude: parseFloat(spot.coords[1]),
                longitude: parseFloat(spot.coords[0]),
              }}
              onPress={() => handleMarkerPress(spot)}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.markerPin}>
                {/* Badge Circle */}
                <View
                  style={[
                    styles.markerBadge,
                    {
                      backgroundColor: color,
                      transform: [{ scale: isSelected ? 1.2 : 1 }],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.markerText,
                      { fontSize: isSelected ? 16 : 13 },
                    ]}
                  >
                    {Math.round(spot.score)}
                  </Text>
                </View>
                {/* Pin Point */}
                <View style={[styles.markerPoint, { borderTopColor: color }]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* My Location Button */}
      {userLocation && (
        <Pressable style={styles.myLocationButton} onPress={handleMyLocation}>
          <Ionicons name="navigate" size={24} color="#2563eb" />
        </Pressable>
      )}

      {/* Spot Info Card */}
      {selectedSpot && (
        <View style={styles.infoCard}>
          <Pressable
            style={styles.closeButton}
            onPress={() => setSelectedSpot(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>

          <ScrollView
            style={styles.infoScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.spotName}>{selectedSpot.name}</Text>
            <Text style={styles.spotRegion}>{selectedSpot.region}</Text>

            {selectedSpot.distance !== undefined && (
              <Text style={styles.spotDistance}>
                📍 {selectedSpot.distance}km away
              </Text>
            )}

            <View style={styles.infoRow}>
              <LinearGradient
                colors={[
                  getMarkerColor(selectedSpot.score),
                  getMarkerColor(selectedSpot.score),
                ]}
                style={styles.suitabilityBadge}
              >
                <Text style={styles.suitabilityLabel}>
                  {selectedSpot.suitability}
                </Text>
                <Text style={styles.suitabilityScore}>
                  {selectedSpot.score}%
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.forecastGrid}>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastIcon}>🌊</Text>
                <Text style={styles.forecastValue}>
                  {selectedSpot.forecast?.waveHeight}m
                </Text>
                <Text style={styles.forecastLabel}>Wave</Text>
              </View>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastIcon}>💨</Text>
                <Text style={styles.forecastValue}>
                  {selectedSpot.forecast?.windSpeed} kph
                </Text>
                <Text style={styles.forecastLabel}>Wind</Text>
              </View>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastIcon}>🌙</Text>
                <Text style={styles.forecastValue}>
                  {selectedSpot.forecast?.tide?.status}
                </Text>
                <Text style={styles.forecastLabel}>Tide</Text>
              </View>
            </View>

            {/* 7-Day Forecast Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>📈 7-Day Forecast</Text>
              <ForecastChart spotId={selectedSpot.id} />
            </View>

            <View style={styles.actionButtons}>
              <Pressable style={styles.actionButton} onPress={handleShare}>
                <Text style={styles.actionButtonIcon}>📤</Text>
                <Text style={styles.actionButtonText}>Share</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleDirections}
              >
                <Text style={styles.actionButtonIcon}>🗺️</Text>
                <Text
                  style={[styles.actionButtonText, styles.primaryButtonText]}
                >
                  Directions
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10b981" }]} />
          <Text style={styles.legendText}>Excellent</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
          <Text style={styles.legendText}>Good</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#f97316" }]} />
          <Text style={styles.legendText}>Fair</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
          <Text style={styles.legendText}>Poor</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  unavailableContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  unavailableIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  unavailableTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  unavailableText: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 8,
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  myLocationIcon: {
    fontSize: 28,
  },
  markerPin: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerPoint: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
  markerText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "white",
  },
  legend: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  infoCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: "70%",
  },
  infoScroll: {
    maxHeight: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#6b7280",
    fontWeight: "bold",
  },
  spotName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  spotRegion: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  spotDistance: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  suitabilityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 100,
  },
  suitabilityLabel: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  suitabilityScore: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginTop: 2,
  },
  forecastGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  forecastItem: {
    alignItems: "center",
  },
  forecastIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },
  forecastLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  guestBanner: {
    backgroundColor: "#f0f9ff",
    padding: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2fe",
    zIndex: 10,
  },
  guestBannerText: {
    color: "#0369a1",
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  primaryButtonText: {
    color: "white",
  },
  chartCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
});

export default MapScreen;
