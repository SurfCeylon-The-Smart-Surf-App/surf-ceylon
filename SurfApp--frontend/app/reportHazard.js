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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { reportHazard, getSurfSpots } from '../services/riskAnalyzerAPI';

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
      const response = await getSurfSpots();
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
      'Select Media',
      'Choose how to add photos/videos',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    try {
      // Request camera permission
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setMediaFiles([...mediaFiles, {
          uri: asset.uri,
          type: asset.type || (asset.uri.includes('mp4') ? 'video' : 'image'),
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
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        allowsMultiple: true,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAssets = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: asset.type || (asset.uri.includes('mp4') ? 'video' : 'image'),
          fileName: asset.fileName || `media_${Date.now()}_${index}.jpg`,
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
      Alert.alert('Error', 'Please add at least one photo or video to verify the hazard');
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
        formDataToSend.append('media', {
          uri: media.uri,
          type: media.type,
          name: media.fileName || `media_${index}.jpg`,
        });
      });

      const response = await reportHazard(formDataToSend);

      if (response.success) {
        Alert.alert(
          'Success',
          'Hazard report submitted! Risk scores will be updated.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSpots) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={["top"]} style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Report Hazard</Text>
            <Text style={styles.headerSubtitle}>
              Help keep the community safe
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.alertBox}>
          <View style={styles.alertIconContainer}>
            <Text style={styles.alertIcon}>⚠️</Text>
          </View>
          <Text style={styles.alertTitle}>Report Current Hazards</Text>
          <Text style={styles.alertText}>Help keep the surfing community safe by reporting hazards</Text>
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
              { value: 'low', label: '🟢 Low Risk', color: '#10b981', bgColor: '#d1fae5' },
              { value: 'medium', label: '🟡 Medium Risk', color: '#f59e0b', bgColor: '#fef3c7' },
              { value: 'high', label: '🔴 High Risk', color: '#ef4444', bgColor: '#fee2e2' }
            ].map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.severityButton,
                  { borderColor: level.color },
                  formData.severity === level.value && { backgroundColor: level.bgColor, borderWidth: 3 }
                ]}
                onPress={() => setFormData({...formData, severity: level.value})}
              >
                <Text
                  style={[
                    styles.severityButtonText,
                    { color: level.color },
                    formData.severity === level.value && { fontWeight: '700' }
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
          <Text style={styles.label}>📸 Photos/Videos *</Text>
          <Text style={styles.helpText}>Visual evidence required to verify the hazard</Text>

          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadButtonText}>
              {mediaFiles.length > 0 ? `${mediaFiles.length} file(s) added` : 'Add Media (Required)'}
            </Text>
            <Text style={styles.uploadButtonSubtext}>Max 5 files</Text>
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
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.submitButtonIcon}>✓</Text>
              <Text style={styles.submitButtonText}>Submit Hazard Report</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>ℹ️</Text>
            </View>
            <Text style={styles.infoTitle}>Reporting Guidelines</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Reports are analyzed within 24 hours</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Risk scores update daily based on reports</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>Clear photos help verify hazards faster</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f3f4f6' },
  
  // Header Styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#bfdbfe',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 32 },
  
  // Alert Box
  alertBox: { 
    backgroundColor: '#eff6ff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#bfdbfe',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIcon: {
    fontSize: 28,
  },
  alertTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1e40af', 
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  alertText: { 
    fontSize: 14, 
    color: '#1e3a8a', 
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Input Groups
  inputGroup: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 4, 
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  label: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#1f2937', 
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  helpText: { 
    fontSize: 13, 
    color: '#6b7280', 
    marginBottom: 10,
    lineHeight: 18,
  },
  input: { 
    backgroundColor: '#f9fafb', 
    borderRadius: 10, 
    padding: 14, 
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#1f2937',
  },
  pickerContainer: { 
    backgroundColor: '#f9fafb', 
    borderRadius: 10, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: { 
    backgroundColor: '#f9fafb', 
    borderRadius: 10, 
    padding: 14, 
    fontSize: 15, 
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#1f2937',
  },
  
  // Severity Buttons
  severityButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 8,
  },
  severityButton: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 10, 
    borderWidth: 2, 
    backgroundColor: 'white', 
    alignItems: 'center',
  },
  severityButtonText: { 
    fontSize: 13, 
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  
  // Upload Button
  uploadButton: { 
    backgroundColor: '#eff6ff', 
    borderWidth: 2, 
    borderColor: '#2563eb', 
    borderStyle: 'dashed', 
    borderRadius: 12, 
    padding: 20, 
    alignItems: 'center',
    gap: 4,
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  uploadButtonText: { 
    color: '#2563eb', 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  uploadButtonSubtext: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  
  // Media Preview
  mediaPreview: { marginTop: 16 },
  mediaItem: { 
    marginRight: 12, 
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  removeButton: { 
    position: 'absolute', 
    top: -8, 
    right: -8, 
    backgroundColor: '#ef4444', 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  removeButtonText: { 
    color: 'white', 
    fontSize: 20, 
    fontWeight: 'bold',
    marginTop: -2,
  },
  
  // Submit Button
  submitButton: { 
    backgroundColor: '#2563eb', 
    borderRadius: 12, 
    padding: 18, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  submitButtonText: { 
    color: 'white', 
    fontSize: 17, 
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  
  // Info Box
  infoBox: { 
    backgroundColor: '#eff6ff', 
    borderRadius: 12, 
    padding: 16, 
    borderLeftWidth: 4, 
    borderLeftColor: '#2563eb',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#1e40af',
    letterSpacing: -0.2,
  },
  infoContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: 16,
    color: '#2563eb',
    marginRight: 8,
    fontWeight: 'bold',
  },
  infoText: { 
    fontSize: 13, 
    color: '#1e3a8a',
    flex: 1,
    lineHeight: 18,
  },
});