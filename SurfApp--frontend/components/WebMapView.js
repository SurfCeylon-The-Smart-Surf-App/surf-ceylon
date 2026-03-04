import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Web-based MapView using Leaflet
 * No API keys required - uses OpenStreetMap tiles
 * Works on all platforms without Google Play Services
 */
const WebMapView = ({ surfSpots, onSpotSelect, selectedSpot, selectedSkillLevel }) => {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sri Lanka center coordinates
  const INITIAL_LAT = 7.8731;
  const INITIAL_LNG = 80.7718;

  // Generate HTML for the map
  const generateMapHTML = () => {
    // Color mapping for risk levels
    const getRiskColor = (flagColor) => {
      switch (flagColor) {
        case 'green':
          return '#10b981';
        case 'yellow':
          return '#f59e0b';
        case 'red':
          return '#ef4444';
        default:
          return '#6b7280';
      }
    };

    // Get risk data for a spot
    const getRiskDataForSkill = (spot) => {
      if (!spot || !spot.skillLevelRisks) {
        return { score: 0, level: 'Unknown', flagColor: 'green' };
      }

      const skillData = spot.skillLevelRisks[selectedSkillLevel];
      if (skillData) {
        return {
          score: skillData.riskScore || 0,
          level: skillData.riskLevel || 'Unknown',
          flagColor: skillData.flagColor || 'green',
        };
      }

      return {
        score: spot.riskScore || 0,
        level: spot.riskLevel || 'Unknown',
        flagColor: spot.flagColor || 'green',
      };
    };

    // Build markers array
    const markersData = surfSpots
      .filter((spot) => spot.coordinates?.latitude && spot.coordinates?.longitude)
      .map((spot) => {
        const riskData = getRiskDataForSkill(spot);
        return {
          id: spot._id,
          name: spot.name,
          lat: spot.coordinates.latitude,
          lng: spot.coordinates.longitude,
          score: riskData.score.toFixed(1),
          color: getRiskColor(riskData.flagColor),
          level: riskData.level,
        };
      });

    const markersJSON = JSON.stringify(markersData);
    const selectedSpotId = selectedSpot?._id || '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
          <style>
            * { margin: 0; padding: 0; }
            html, body, #map { height: 100%; width: 100%; }
            .leaflet-container { background-color: #f0f0f0; }
            .marker-popup { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .marker-title { font-weight: bold; color: #0891b2; margin-bottom: 4px; }
            .marker-score { color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const markers = ${markersJSON};
            const selectedSpotId = '${selectedSpotId}';
            
            // Initialize map
            const map = L.map('map').setView([${INITIAL_LAT}, ${INITIAL_LNG}], 8);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '',
              maxZoom: 19,
              minZoom: 6
            }).addTo(map);
            
            // Create marker cluster if many markers
            const markerGroup = L.featureGroup();
            const markersArray = [];
            
            // Add markers to map
            markers.forEach((markerData) => {
              const markerHtml = \`
                <div style="
                  width: 40px;
                  height: 40px;
                  background-color: \${markerData.color};
                  border: 3px solid white;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  color: white;
                  font-size: 14px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  \${selectedSpotId === markerData.id ? 'width: 48px; height: 48px; border-width: 4px;' : ''}
                ">\${markerData.score}</div>
              \`;
              
              const marker = L.marker([markerData.lat, markerData.lng], {
                icon: L.divIcon({
                  html: markerHtml,
                  iconSize: [40, 40],
                  className: 'custom-marker'
                })
              }).bindPopup(\`
                <div class="marker-popup">
                  <div class="marker-title">\${markerData.name}</div>
                  <div class="marker-score">Risk: \${markerData.score}/10 (\${markerData.level})</div>
                </div>
              \`);
              
              marker.on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'spotSelected',
                  spotId: markerData.id,
                  spotName: markerData.name
                }));
              });
              
              marker.addTo(map);
              markersArray.push(marker);
              markerGroup.addLayer(marker);
            });
            
            // Fit all markers in view
            if (markersArray.length > 0) {
              setTimeout(() => {
                map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
              }, 500);
            }
            
            // Add zoom controls
            L.control.zoom({ position: 'topright' }).addTo(map);
            
            document.addEventListener('DOMContentLoaded', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
            });
          </script>
        </body>
      </html>
    `;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapReady') {
        console.log('✅ Web map is ready');
        setIsLoading(false);
      } else if (data.type === 'spotSelected') {
        console.log('📍 Spot selected:', data.spotName);
        // Find the selected spot and call onSpotSelect
        const selectedSpot = surfSpots.find((spot) => spot._id === data.spotId);
        if (selectedSpot && onSpotSelect) {
          onSpotSelect(selectedSpot);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  if (!surfSpots || surfSpots.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.noSpotsContainer}>
          <Text style={styles.noSpotsText}>📍 No surf spots available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: generateMapHTML() }}
        onMessage={handleMessage}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0891b2" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
      />

      {/* Selected Spot Banner */}
      {selectedSpot && (
        <View style={styles.selectedSpotBanner}>
          <Text style={styles.selectedSpotName}>{selectedSpot.name}</Text>
          <Text style={styles.selectedSpotRisk}>
            Risk Score: {selectedSpot.skillLevelRisks?.[selectedSkillLevel]?.riskScore?.toFixed(1) || selectedSpot.riskScore?.toFixed(1) || '0.0'}/10
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0891b2',
  },
  noSpotsContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSpotsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  selectedSpotBanner: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 80,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedSpotName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0891b2',
    marginBottom: 4,
  },
  selectedSpotRisk: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default WebMapView;