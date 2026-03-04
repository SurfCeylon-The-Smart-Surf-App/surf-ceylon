import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  StatusBar,
  Linking,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hazardReportsAPI, surfSpotsAPI } from '../services/risk_api';

const HAZARD_TYPES = [
  'Rip Current', 'High Surf', 'Reef Cuts', 'Jellyfish', 
  'Sea Urchins', 'Strong Winds', 'Poor Visibility', 
  'Overcrowding', 'Equipment Issues', 'Marine Life', 'Other'
];

export default function ReportHazardScreen() {
  const router = useRouter();
  const [surfSpots, setSurfSpots] = useState([]);
  const [formData, setFormData] = useState({
    surfSpotId: '',
    hazardType: HAZARD_TYPES[0],
    description: '',
    severity: 'medium',
    reporterName: '',
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSpots, setLoadingSpots] = useState(true);

  useEffect(() => {
    loadSurfSpots();
  }, []);

  const loadSurfSpots = async () => {
    try {
      const response = await surfSpotsAPI.getAll();
      if (response.success) {
        setSurfSpots(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({...prev, surfSpotId: response.data[0]._id}));
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load surf spots');
    } finally {
      setLoadingSpots(false);
    }
  };

  const pickImage = () => {
    Alert.alert(
      'Select Photo',
      'Choose how to add a photo',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    try {
      // Check current camera permission status first
      const { status: currentStatus } = await ImagePicker.getCameraPermissionsAsync();
      
      if (currentStatus === 'denied') {
        // Permission was previously denied - guide user to settings
        Alert.alert(
          'Camera Permission Required',
          'Camera access was denied. Please enable it in your device settings to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      
      // Request camera permission if not determined yet
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setMediaFiles([...mediaFiles, {
          uri: asset.uri,
          type: 'image',
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        }]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openGallery = async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library permission is required to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultiple: true,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAssets = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: 'image',
          fileName: asset.fileName || `photo_${Date.now()}_${index}.jpg`,
        }));
        setMediaFiles([...mediaFiles, ...newAssets]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const removeMedia = (index) => {
    const newMedia = [...mediaFiles];
    newMedia.splice(index, 1);
    setMediaFiles(newMedia);
  };

  const handleSubmit = async () => {
    if (!formData.surfSpotId || !formData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (mediaFiles.length === 0) {
      Alert.alert('Error', 'Please add at least one photo to verify the hazard');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('surfSpotId', formData.surfSpotId);
      formDataToSend.append('hazardType', formData.hazardType);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('severity', formData.severity);
      formDataToSend.append('reporterName', formData.reporterName || 'Anonymous');

      mediaFiles.forEach((media, index) => {
        // Get proper MIME type for the file
        const getMimeType = (uri) => {
          if (uri.includes('.png')) {
            return 'image/png';
          }
          return 'image/jpeg';
        };

        const mimeType = getMimeType(media.uri);
        const fileName = media.fileName || `photo_${index}.jpg`;
        
        formDataToSend.append('media', {
          uri: media.uri,
          type: mimeType,
          name: fileName,
        });
      });

      const response = await hazardReportsAPI.submit(formDataToSend);

      if (response.success) {
        Alert.alert(
          '✅ Report Submitted Successfully',
          'Thank you for helping keep surfers safe!\n\n' +
          '🤖 Our system will now:\n' +
          '• Analyze your uploaded media\n' +
          '• Verify the hazard type\n' +
          '• Update risk scores for this surf spot\n\n' +
          '',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else if (response.rejected) {
        // Check if it's a duplicate image rejection
        if (response.rejectionReason === 'duplicate_image') {
          Alert.alert(
            '❌ Duplicate Image',
            'This image has already been submitted as a hazard report.',
            [{ text: 'OK' }]
          );
        } else {
          // Image was rejected by AI validation (not a valid surf scene)
          Alert.alert(
            '❌ Image Rejected',
            'Please upload a clear photo of an actual surf hazard (shark, jellyfish, rip current, sea urchin, large waves, or reef danger).',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to submit report');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSpots) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
      
      {/* Blue Gradient Header */}
      <LinearGradient
        colors={['#3b82f6', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Report Hazard</Text>
        <Text style={styles.headerSubtitle}>Help keep surfers safe</Text>
      </LinearGradient>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Alert Box */}
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>⚠️ Report Current Hazards</Text>
            <Text style={styles.alertText}>Help keep the surfing community safe</Text>
          </View>

          {/* Reporter Name (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Leave blank for anonymous"
            value={formData.reporterName}
            onChangeText={(text) => setFormData({...formData, reporterName: text})}
          />
        </View>

        {/* Surf Spot */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Surf Spot *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.surfSpotId}
              onValueChange={(value) => setFormData({...formData, surfSpotId: value})}
            >
              {surfSpots.map((spot) => (
                <Picker.Item key={spot._id} label={spot.name} value={spot._id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Hazard Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hazard Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.hazardType}
              onValueChange={(value) => setFormData({...formData, hazardType: value})}
            >
              {HAZARD_TYPES.map((type) => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Severity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Severity Level *</Text>
          <View style={styles.severityButtons}>
            {[
              { value: 'low', label: 'Low', color: '#10b981' },
              { value: 'medium', label: 'Medium', color: '#f59e0b' },
              { value: 'high', label: 'High', color: '#ef4444' }
            ].map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.severityButton,
                  formData.severity === level.value && styles.severityButtonActive
                ]}
                onPress={() => setFormData({...formData, severity: level.value})}
              >
                <Text
                  style={[
                    styles.severityButtonText,
                    { color: level.color },
                    formData.severity === level.value && styles.severityButtonTextActive
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the hazard in detail..."
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Media Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Photos *</Text>
          <Text style={styles.helpText}>Visual evidence is required to verify the hazard</Text>

          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadButtonText}>📷 Add Photo {mediaFiles.length > 0 ? `(${mediaFiles.length}/5)` : ''}</Text>
          </TouchableOpacity>

          {/* Media Preview */}
          {mediaFiles.length > 0 && (
            <ScrollView horizontal style={styles.mediaPreview}>
              {mediaFiles.map((media, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeMedia(index)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Hazard Report</Text>
          )}
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Reporting Guidelines</Text>
          <Text style={styles.infoText}>• Reports are analyzed within 24 hours</Text>
          <Text style={styles.infoText}>• Risk scores update daily based on reports</Text>
          <Text style={styles.infoText}>• Clear photos help verify hazards faster</Text>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header styles
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  content: { padding: 16 },
  alertBox: { backgroundColor: '#fee2e2', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#fca5a5' },
  alertTitle: { fontSize: 16, fontWeight: '600', color: '#991b1b', textAlign: 'center' },
  alertText: { fontSize: 14, color: '#991b1b', textAlign: 'center', marginTop: 4 },
  inputGroup: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  helpText: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, fontSize: 14 },
  pickerContainer: { backgroundColor: '#f9fafb', borderRadius: 8, overflow: 'hidden' },
  textArea: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 120 },
  severityButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  severityButton: { flex: 1, marginHorizontal: 4, paddingVertical: 12, borderRadius: 8, borderWidth: 2, borderColor: '#e5e7eb', backgroundColor: 'white', alignItems: 'center' },
  severityButtonActive: { borderColor: '#0891b2', backgroundColor: '#e0f2fe' },
  severityButtonText: { fontSize: 14, fontWeight: '600' },
  severityButtonTextActive: { color: '#0891b2' },
  uploadButton: { backgroundColor: '#e0f2fe', borderWidth: 2, borderColor: '#0891b2', borderStyle: 'dashed', borderRadius: 8, padding: 16, alignItems: 'center' },
  uploadButtonText: { color: '#0891b2', fontSize: 15, fontWeight: '600' },
  mediaPreview: { marginTop: 12 },
  mediaItem: { marginRight: 12, position: 'relative' },
  mediaImage: { width: 100, height: 100, borderRadius: 8 },
  removeButton: { position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  removeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  submitButton: { backgroundColor: '#ef4444', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  infoBox: { backgroundColor: '#dbeafe', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#1e40af', marginBottom: 8 },
  infoText: { fontSize: 12, color: '#1e40af', marginBottom: 4 },
});