import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useUser } from "../../context/UserContext";
import { API_ENDPOINTS } from "../../config/network";

const { width: SCREEN_W } = Dimensions.get("window");
const MAX_PHOTOS = 5;

const validateSriLankanPhone = (phone) => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const patterns = [
    /^\+94\d{9}$/,
    /^94\d{9}$/,
    /^0\d{9}$/,
  ];
  return patterns.some((p) => p.test(cleaned));
};

const formatPhoneDisplay = (phone) => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+94")) {
    return `tel:+${cleaned}`;
  }
  if (cleaned.startsWith("94")) {
    return `tel:+${cleaned}`;
  }
  if (cleaned.startsWith("0")) {
    return `tel:+94${cleaned.slice(1)}`;
  }
  return `tel:${phone}`;
};

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CATEGORIES = [
  "All",
  "Surf Schools",
  "Instructors",
  "Rental Shops",
  "Boat Tours",
  "Gear & Equipment",
  "Other",
];

const CATEGORY_ICONS = {
  "Surf Schools": "🎓",
  Instructors: "🏄",
  "Rental Shops": "🏪",
  "Boat Tours": "🚤",
  "Gear & Equipment": "🛹",
  Other: "📦",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "Surf Schools",
  price: "",
  location: "",
  contactPhone: "",
  contactEmail: "",
};

// ─────────────────────────────────────────────
// Photo Strip (reusable)
// ─────────────────────────────────────────────
const PhotoStrip = ({ images = [], onRemove, editable = false }) => {
  if (images.length === 0 && !editable) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
    >
      {images.map((uri, idx) => (
        <View key={idx} style={{ position: "relative" }}>
          <Image
            source={{ uri }}
            style={{
              width: 90,
              height: 90,
              borderRadius: 10,
              backgroundColor: "#e5e7eb",
            }}
            resizeMode="cover"
          />
          {editable && onRemove && (
            <TouchableOpacity
              onPress={() => onRemove(idx)}
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#ef4444",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={13} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

// ─────────────────────────────────────────────
// InfoRow – used in the detail modal
// ─────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => (
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 11,
        backgroundColor: "#eff6ff",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
      }}
    >
      <Ionicons name={`${icon}-outline`} size={17} color="#2563eb" />
    </View>
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 11,
          color: "#94a3b8",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#111827",
          fontWeight: "500",
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────
// Form Field – defined OUTSIDE modal to prevent keyboard dismiss on re-render
// ─────────────────────────────────────────────
const FormField = ({
  label,
  field,
  placeholder,
  keyboardType,
  multiline,
  value,
  onChange,
}) => (
  <View style={{ marginBottom: 14 }}>
    <Text
      style={{
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 6,
      }}
    >
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={(v) => onChange(field, v)}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      keyboardType={keyboardType || "default"}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      style={{
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 14,
        color: "#111827",
        backgroundColor: "#fafafa",
        textAlignVertical: multiline ? "top" : "center",
        minHeight: multiline ? 80 : 48,
      }}
    />
  </View>
);

// ─────────────────────────────────────────────
// Listing Card
// ─────────────────────────────────────────────
const ListingCard = ({
  item,
  isBusiness,
  isOwner,
  onEdit,
  onDelete,
  onPress,
  onMessage,
}) => {
  const [activePhoto, setActivePhoto] = useState(0);
  const hasMultiplePhotos = item.images && item.images.length > 1;

  useEffect(() => {
    if (!hasMultiplePhotos) return;
    const interval = setInterval(() => {
      setActivePhoto((prev) => (prev + 1) % item.images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [hasMultiplePhotos, item.images.length]);

  const thumb = item.images && item.images.length > 0 ? item.images[activePhoto] : null;

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        overflow: "hidden",
      }}
    >
      {/* Thumbnail */}
      {thumb ? (
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: thumb }}
            style={{ width: "100%", height: 160 }}
            resizeMode="cover"
          />
          {hasMultiplePhotos && (
            <View
              style={{
                position: "absolute",
                bottom: 8,
                left: 0,
                right: 0,
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {item.images.map((_, idx) => (
                <View
                  key={idx}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor:
                      idx === activePhoto ? "#ffffff" : "rgba(255,255,255,0.5)",
                  }}
                />
              ))}
            </View>
          )}
        </View>
      ) : null}

      <View style={{ padding: 14 }}>
        {/* Category badge + price */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 6,
          }}
        >
          <View
            style={{
              backgroundColor: "#eff6ff",
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 11, color: "#2563eb", fontWeight: "700" }}>
              {CATEGORY_ICONS[item.category]} {item.category}
            </Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#2563eb" }}>
            {item.price}
          </Text>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#1e293b",
            marginBottom: 4,
          }}
        >
          {item.title}
        </Text>

        {/* Description */}
        <Text
          numberOfLines={2}
          style={{
            fontSize: 13,
            color: "#64748b",
            lineHeight: 18,
            marginBottom: 10,
          }}
        >
          {item.description}
        </Text>

        {/* Meta */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="location-outline" size={13} color="#94a3b8" />
            <Text style={{ fontSize: 12, color: "#64748b", marginLeft: 3 }}>
              {item.location}
            </Text>
          </View>
          {item.businessName ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="storefront-outline" size={13} color="#94a3b8" />
              <Text style={{ fontSize: 12, color: "#64748b", marginLeft: 3 }}>
                {item.businessName}
              </Text>
            </View>
          ) : null}
          {item.rating > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="star" size={13} color="#f59e0b" />
              <Text
                style={{
                  fontSize: 12,
                  color: "#1e293b",
                  fontWeight: "600",
                  marginLeft: 2,
                }}
              >
                {item.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Actions – vary by role */}
        {isOwner ? (
          /* Business owner: show edit & delete only */
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onEdit(item);
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: "#fff7ed",
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#fbbf24",
              }}
            >
              <Ionicons name="pencil-outline" size={15} color="#d97706" />
              <Text
                style={{ color: "#d97706", fontWeight: "700", fontSize: 13 }}
              >
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onDelete(item);
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: "#fff5f5",
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#fca5a5",
              }}
            >
              <Ionicons name="trash-outline" size={15} color="#ef4444" />
              <Text
                style={{ color: "#ef4444", fontWeight: "700", fontSize: 13 }}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Personal / non-owner: show Contact + Message */
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={async (e) => {
                e.stopPropagation?.();
                if (!item.contactPhone) {
                  Alert.alert("Unavailable", "No contact phone number provided for this listing.");
                  return;
                }
                const phoneUrl = formatPhoneDisplay(item.contactPhone);
                const supported = await Linking.canOpenURL(phoneUrl);
                if (supported) {
                  await Linking.openURL(phoneUrl);
                } else {
                  Alert.alert("Error", "Unable to make phone calls on this device.");
                }
              }}
              style={{
                flex: 1,
                backgroundColor: "#2563eb",
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                📞 Contact
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onMessage && onMessage(item);
              }}
              style={{
                width: 42,
                height: 42,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chatbubble-outline" size={17} color="#2563eb" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// Listing Form Modal  (Business only, multipart)
// ─────────────────────────────────────────────
const ListingFormModal = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState([]);
  const [phoneError, setPhoneError] = useState("");
  const isEdit = !!initialData?._id;

  useEffect(() => {
    if (visible) {
      setForm(
        initialData
          ? {
              title: initialData.title || "",
              description: initialData.description || "",
              category: initialData.category || "Surf Schools",
              price: initialData.price || "",
              location: initialData.location || "",
              contactPhone: initialData.contactPhone || "",
              contactEmail: initialData.contactEmail || "",
            }
          : EMPTY_FORM,
      );
      const existing = (initialData?.images || []).map((url) => ({
        uri: url,
        existing: true,
      }));
      setPhotos(existing);
      setPhoneError("");
    }
  }, [visible, initialData]);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (field === "contactPhone") {
      if (value.trim() && !validateSriLankanPhone(value)) {
        setPhoneError("Enter a valid Sri Lankan number (e.g. 077 000 0000)");
      } else {
        setPhoneError("");
      }
    }
  };

  const pickPhotos = async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      Alert.alert(
        "Limit reached",
        `You can upload at most ${MAX_PHOTOS} photos.`,
      );
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.75,
    });
    if (!result.canceled) {
      const newPics = result.assets
        .slice(0, remaining)
        .map((a) => ({ uri: a.uri, existing: false }));
      setPhotos((prev) => [...prev, ...newPics].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.price.trim() ||
      !form.location.trim()
    ) {
      Alert.alert(
        "Missing Fields",
        "Please fill in title, description, price, and location.",
      );
      return;
    }
    if (!form.contactPhone.trim()) {
      Alert.alert(
        "Missing Phone Number",
        "Contact phone number is required. Please enter a valid Sri Lankan phone number.",
      );
      return;
    }
    if (!validateSriLankanPhone(form.contactPhone)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid Sri Lankan phone number. Examples:\n• 077 000 0000\n• +94 77 000 0000\n• 94 77 000 0000",
      );
      return;
    }
    onSubmit(form, photos);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <SafeAreaView
          edges={["top"]}
          style={{ flex: 1, backgroundColor: "#fff" }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#f1f5f9",
            }}
          >
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
              {isEdit ? "Edit Listing" : "New Listing"}
            </Text>
            <TouchableOpacity onPress={handleSubmit} disabled={isLoading}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: isLoading ? "#93c5fd" : "#2563eb",
                }}
              >
                {isLoading ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Photo picker */}
            <View style={{ marginBottom: 18 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "700", color: "#374151" }}
                >
                  Photos ({photos.length}/{MAX_PHOTOS})
                </Text>
                {photos.length < MAX_PHOTOS && (
                  <TouchableOpacity
                    onPress={pickPhotos}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: "#eff6ff",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                  >
                    <Ionicons name="image-outline" size={15} color="#2563eb" />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#2563eb",
                        fontWeight: "600",
                      }}
                    >
                      Add Photos
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <PhotoStrip
                images={photos.map((p) => p.uri)}
                editable
                onRemove={removePhoto}
              />

              {photos.length === 0 && (
                <TouchableOpacity
                  onPress={pickPhotos}
                  style={{
                    height: 110,
                    borderWidth: 2,
                    borderColor: "#e5e7eb",
                    borderStyle: "dashed",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Ionicons name="camera-outline" size={28} color="#9ca3af" />
                  <Text
                    style={{ color: "#9ca3af", fontSize: 13, marginTop: 6 }}
                  >
                    Tap to add up to {MAX_PHOTOS} photos
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <FormField
              label="Title *"
              field="title"
              placeholder="e.g. Arugam Bay Surf School"
              value={form.title}
              onChange={handleChange}
            />
            <FormField
              label="Description *"
              field="description"
              placeholder="Describe your service..."
              multiline
              value={form.description}
              onChange={handleChange}
            />
            <FormField
              label="Price *"
              field="price"
              placeholder="e.g. LKR 3,500/day"
              value={form.price}
              onChange={handleChange}
            />
            <FormField
              label="Location *"
              field="location"
              placeholder="e.g. Arugam Bay"
              value={form.location}
              onChange={handleChange}
            />

            {/* Category picker */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => handleChange("category", cat)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1.5,
                        borderColor:
                          form.category === cat ? "#2563eb" : "#e5e7eb",
                        backgroundColor:
                          form.category === cat ? "#eff6ff" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: form.category === cat ? "#2563eb" : "#374151",
                        }}
                      >
                        {CATEGORY_ICONS[cat]} {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Contact Phone – required */}
            <View style={{ marginBottom: 14 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Contact Phone
                </Text>
                <Text style={{ color: "#ef4444", marginLeft: 4 }}>*</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: phoneError ? "#ef4444" : "#e5e7eb",
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: phoneError ? "#fef2f2" : "#fafafa",
                }}
              >
                <Ionicons name="call-outline" size={16} color="#9ca3af" />
                <TextInput
                  value={form.contactPhone}
                  onChangeText={(v) => handleChange("contactPhone", v)}
                  placeholder="+94 77 000 0000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    fontSize: 14,
                    color: "#111827",
                    paddingVertical: 0,
                  }}
                />
              </View>
              {phoneError ? (
                <Text
                  style={{
                    color: "#ef4444",
                    fontSize: 12,
                    marginTop: 4,
                    paddingLeft: 4,
                  }}
                >
                  {phoneError}
                </Text>
              ) : (
                <Text
                  style={{
                    color: "#9ca3af",
                    fontSize: 11,
                    marginTop: 4,
                    paddingLeft: 4,
                  }}
                >
                  Required. Sri Lankan numbers only (e.g. 077 000 0000)
                </Text>
              )}
            </View>
            <FormField
              label="Contact Email"
              field="contactEmail"
              placeholder="hello@business.com"
              keyboardType="email-address"
              value={form.contactEmail}
              onChange={handleChange}
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Detail Page Modal  (same style as form modal)
// ─────────────────────────────────────────────
const ListingDetailModal = ({
  visible,
  listing,
  onClose,
  isOwner,
  isBusiness,
  onEdit,
  onDelete,
  onMessage,
}) => {
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    if (visible) setImgIndex(0);
  }, [visible, listing]);

  if (!listing) return null;

  const images = listing.images || [];
  const showContactButtons = !isOwner && !isBusiness;
  const showOwnerButtons = isOwner;

  const buttonsHeight = showContactButtons ? 122 : showOwnerButtons ? 62 : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Fixed Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: "#f1f5f9",
            zIndex: 2,
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: "#111827",
              flex: 1,
              textAlign: "center",
              marginHorizontal: 12,
            }}
          >
            {listing.title}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Fixed Image Carousel */}
        {images.length > 0 ? (
          <View style={{ zIndex: 1 }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_W,
                );
                setImgIndex(idx);
              }}
            >
              {images.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={{ width: SCREEN_W, height: 260 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 12,
                }}
              >
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === imgIndex ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === imgIndex ? "#2563eb" : "#d1d5db",
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View
            style={{
              height: 200,
              backgroundColor: "#f1f5f9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="image-outline" size={52} color="#d1d5db" />
            <Text style={{ color: "#d1d5db", fontSize: 13, marginTop: 8 }}>
              No photos available
            </Text>
          </View>
        )}

        {/* Scrollable Details */}
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: buttonsHeight + 32,
            }}
          >
            {/* Category badge + price */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: "#eff6ff",
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{ fontSize: 12, color: "#2563eb", fontWeight: "700" }}
                >
                  {CATEGORY_ICONS[listing.category]} {listing.category}
                </Text>
              </View>
              <Text
                style={{ fontSize: 22, fontWeight: "800", color: "#2563eb" }}
              >
                {listing.price}
              </Text>
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: "#111827",
                marginBottom: 8,
              }}
            >
              {listing.title}
            </Text>

            {/* Star rating */}
            {listing.rating > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={
                      s <= Math.round(listing.rating) ? "star" : "star-outline"
                    }
                    size={17}
                    color="#f59e0b"
                  />
                ))}
                <Text
                  style={{
                    marginLeft: 7,
                    fontSize: 14,
                    color: "#374151",
                    fontWeight: "600",
                  }}
                >
                  {listing.rating.toFixed(1)}
                </Text>
                {listing.reviewCount > 0 && (
                  <Text
                    style={{ marginLeft: 5, color: "#94a3b8", fontSize: 13 }}
                  >
                    ({listing.reviewCount} reviews)
                  </Text>
                )}
              </View>
            )}

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: "#f1f5f9",
                marginBottom: 18,
              }}
            />

            {/* Description */}
            <Text
              style={{
                fontSize: 15,
                color: "#374151",
                lineHeight: 24,
                marginBottom: 22,
              }}
            >
              {listing.description}
            </Text>

            {/* Info card */}
            <View
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 16,
                padding: 18,
                gap: 16,
                marginBottom: 24,
              }}
            >
              <InfoRow
                icon="location"
                label="Location"
                value={listing.location}
              />
              {listing.businessName ? (
                <InfoRow
                  icon="storefront"
                  label="Business"
                  value={listing.businessName}
                />
              ) : null}
              {listing.contactPhone ? (
                <InfoRow
                  icon="call"
                  label="Phone"
                  value={listing.contactPhone}
                />
              ) : null}
              {listing.contactEmail ? (
                <InfoRow
                  icon="mail"
                  label="Email"
                  value={listing.contactEmail}
                />
              ) : null}
              <InfoRow
                icon="time"
                label="Listed"
                value={new Date(listing.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
            </View>
          </ScrollView>
        </View>

        {/* Fixed Buttons at Bottom */}
        {showContactButtons && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 20,
              borderTopWidth: 1,
              borderTopColor: "#f1f5f9",
              backgroundColor: "#fff",
              zIndex: 2,
            }}
          >
            <TouchableOpacity
              onPress={async () => {
                const phoneUrl = formatPhoneDisplay(listing.contactPhone);
                const supported = await Linking.canOpenURL(phoneUrl);
                if (supported) {
                  await Linking.openURL(phoneUrl);
                } else {
                  Alert.alert("Error", "Unable to make phone calls on this device.");
                }
              }}
              style={{
                backgroundColor: "#2563eb",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Contact / Enquire Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                setTimeout(() => onMessage && onMessage(listing), 300);
              }}
              style={{
                backgroundColor: "#f1f5f9",
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#374151",
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Message Business
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showOwnerButtons && (
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 20,
              borderTopWidth: 1,
              borderTopColor: "#f1f5f9",
              backgroundColor: "#fff",
              zIndex: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                onClose();
                setTimeout(() => onEdit(listing), 300);
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: "#fff7ed",
                paddingVertical: 13,
                borderRadius: 13,
                borderWidth: 1.5,
                borderColor: "#fbbf24",
              }}
            >
              <Ionicons name="pencil" size={16} color="#d97706" />
              <Text
                style={{
                  color: "#d97706",
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                setTimeout(() => onDelete(listing), 300);
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: "#fff5f5",
                paddingVertical: 13,
                borderRadius: 13,
                borderWidth: 1.5,
                borderColor: "#fca5a5",
              }}
            >
              <Ionicons name="trash" size={16} color="#ef4444" />
              <Text
                style={{
                  color: "#ef4444",
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function MarketScreen() {
  const { user, token, isBusiness } = useUser();

  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("browse");

  // Form modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Detail modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  // ── Fetch helpers ──
  const fetchListings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "All") params.append("category", activeCategory);
      if (searchText.trim()) params.append("search", searchText.trim());

      const url = `${API_ENDPOINTS.MARKET}?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setListings(data.data);
    } catch (err) {
      console.error("Fetch listings error:", err);
    }
  }, [token, activeCategory, searchText]);

  const fetchMyListings = useCallback(async () => {
    if (!isBusiness) return;
    try {
      const res = await fetch(API_ENDPOINTS.MARKET_MY_LISTINGS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMyListings(data.data);
    } catch (err) {
      console.error("Fetch my listings error:", err);
    }
  }, [token, isBusiness]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchListings(), fetchMyListings()]);
    setLoading(false);
  }, [fetchListings, fetchMyListings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchListings(), fetchMyListings()]);
    setRefreshing(false);
  }, [fetchListings, fetchMyListings]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);
  useEffect(() => {
    fetchListings();
  }, [activeCategory, searchText, fetchListings]);

  // ── Detail modal open/close ──
  const openDetail = (item) => {
    setSelectedListing(item);
    setDetailVisible(true);
  };
  const closeDetail = () => setDetailVisible(false);

  // ── CRUD actions ──
  const handleCreate = () => {
    setEditTarget(null);
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditTarget(item);
    setModalVisible(true);
  };

  const handleDelete = (item) => {
    Alert.alert(
      "Delete Listing",
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(API_ENDPOINTS.MARKET_LISTING(item._id), {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (data.success) {
                Alert.alert("Deleted", "Listing removed successfully.");
                fetchListings();
                fetchMyListings();
              } else {
                Alert.alert("Error", data.error || "Failed to delete listing.");
              }
            } catch {
              Alert.alert("Error", "Network error. Please try again.");
            }
          },
        },
      ],
    );
  };

  const handleFormSubmit = async (formData, photos) => {
    setFormLoading(true);
    const isEdit = !!editTarget?._id;
    const url = isEdit
      ? API_ENDPOINTS.MARKET_LISTING(editTarget._id)
      : API_ENDPOINTS.MARKET;
    const method = isEdit ? "PUT" : "POST";

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));

      photos
        .filter((p) => !p.existing)
        .forEach((p) => {
          const ext = p.uri.split(".").pop() || "jpg";
          fd.append("images", {
            uri: p.uri,
            name: `photo.${ext}`,
            type: `image/${ext}`,
          });
        });

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setModalVisible(false);
        Alert.alert(
          "Success",
          isEdit ? "Listing updated!" : "Listing created!",
        );
        fetchListings();
        fetchMyListings();
      } else {
        Alert.alert("Error", data.error || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Render helpers ──
  const renderCategoryPill = (cat) => (
    <TouchableOpacity
      key={cat}
      onPress={() => setActiveCategory(cat)}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: activeCategory === cat ? "#2563eb" : "#fff",
        borderWidth: 1,
        borderColor: activeCategory === cat ? "#2563eb" : "#e5e7eb",
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: activeCategory === cat ? "#fff" : "#374151",
        }}
      >
        {cat !== "All" ? `${CATEGORY_ICONS[cat]} ` : ""}
        {cat}
      </Text>
    </TouchableOpacity>
  );

  const handleMessage = useCallback(
    async (item) => {
      const ownerId = item.owner?._id || item.owner;
      if (!ownerId) {
        Alert.alert("Unavailable", "Cannot message this listing's owner.");
        return;
      }
      try {
        const res = await fetch(API_ENDPOINTS.CONVERSATIONS, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ participants: [ownerId], isGroup: false }),
        });
        const data = await res.json();
        const convId = data?.data?.conversation?._id;
        if (convId) {
          router.push(`/chat?conversationId=${convId}`);
        } else {
          Alert.alert(
            "Error",
            "Could not start a conversation. Please try again.",
          );
        }
      } catch (err) {
        console.error("handleMessage error:", err);
        Alert.alert("Error", "Network error. Please try again.");
      }
    },
    [token],
  );

  const renderCard = ({ item }) => {
    const ownerView = isBusiness && item.owner?._id === user?._id;
    return (
      <ListingCard
        item={item}
        isBusiness={isBusiness}
        isOwner={ownerView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPress={openDetail}
        onMessage={!ownerView && !isBusiness ? handleMessage : undefined}
      />
    );
  };

  const headerGradient = isBusiness
    ? ["#d97706", "#b45309"]
    : ["#2563eb", "#1d4ed8"];

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <StatusBar barStyle="light-content" />

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView
          edges={["top"]}
          style={{ paddingHorizontal: 20, paddingBottom: 16 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>
                Surf Market
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {isBusiness
                  ? `${user?.businessName || "Business"} Dashboard`
                  : "Find surf schools, instructors & gear"}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.2)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
                marginBottom: 18,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {isBusiness ? "🏪 Business" : "🏄 Personal"}
              </Text>
            </View>
          </View>

          {isBusiness && (
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "rgba(0,0,0,0.2)",
                borderRadius: 12,
                padding: 3,
                marginTop: 14,
              }}
            >
              {["browse", "my-listings"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: activeTab === tab ? "#fff" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color:
                        activeTab === tab ? "#d97706" : "rgba(255,255,255,0.8)",
                    }}
                  >
                    {tab === "browse" ? "Browse All" : "My Listings"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* ── Body ── */}
      <View style={{ flex: 1 }}>
        {activeTab === "browse" ? (
          <>
            {/* Fixed Search + Filters Section */}
            <View
              style={{
                backgroundColor: "#f8fafc",
                zIndex: 1,
                elevation: 3,
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
              }}
            >
              {/* Search Bar */}
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingTop: 12,
                  paddingBottom: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Ionicons name="search" size={18} color="#9ca3af" />
                  <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search surf schools, instructors..."
                    placeholderTextColor="#9ca3af"
                    style={{
                      flex: 1,
                      marginLeft: 10,
                      fontSize: 14,
                      color: "#111827",
                    }}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText("")}>
                      <Ionicons name="close-circle" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Category pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ height: 48 }}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  alignItems: "center",
                  paddingBottom: 8,
                }}
              >
                {CATEGORIES.map(renderCategoryPill)}
              </ScrollView>
            </View>

            {/* Listings */}
            {loading ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>
                  Loading listings...
                </Text>
              </View>
            ) : (
              <FlatList
                data={listings}
                renderItem={renderCard}
                keyExtractor={(item) =>
                  item._id?.toString() || item.id?.toString()
                }
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 8,
                  paddingBottom: 100,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#2563eb"
                  />
                }
                ListEmptyComponent={
                  <View style={{ alignItems: "center", paddingTop: 60 }}>
                    <Text style={{ fontSize: 48 }}>🌊</Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#374151",
                        marginTop: 12,
                      }}
                    >
                      No listings found
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#94a3b8",
                        marginTop: 6,
                        textAlign: "center",
                      }}
                    >
                      {isBusiness
                        ? "Be the first to list your services!"
                        : "Check back soon for surf services near you."}
                    </Text>
                  </View>
                }
              />
            )}
          </>
        ) : (
          /* My Listings Tab */
          <FlatList
            data={myListings}
            renderItem={renderCard}
            keyExtractor={(item) => item._id?.toString()}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#d97706"
              />
            }
            ListHeaderComponent={
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: "#111827",
                  }}
                >
                  My Listings ({myListings.length})
                </Text>
                <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  Manage your surf service listings
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <Text style={{ fontSize: 48 }}>📋</Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#374151",
                    marginTop: 12,
                  }}
                >
                  No listings yet
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#94a3b8",
                    marginTop: 6,
                    textAlign: "center",
                  }}
                >
                  Tap + to create your first listing.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── FAB (Business only) ── */}
      {isBusiness && (
        <TouchableOpacity
          onPress={handleCreate}
          style={{
            position: "absolute",
            bottom: 28,
            right: 24,
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: "#d97706",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#d97706",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ── Personal notice ── */}
      {!isBusiness && (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: "#eff6ff",
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#bfdbfe",
          }}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#2563eb"
          />
          <Text
            style={{ fontSize: 12, color: "#1d4ed8", marginLeft: 8, flex: 1 }}
          >
            Upgrade to a Business account to list your surf services.
          </Text>
        </View>
      )}

      {/* ── Listing Form Modal ── */}
      <ListingFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleFormSubmit}
        initialData={editTarget}
        isLoading={formLoading}
      />

      {/* ── Detail Page Modal ── */}
      <ListingDetailModal
        visible={detailVisible}
        listing={selectedListing}
        onClose={closeDetail}
        isOwner={isBusiness && selectedListing?.owner?._id === user?._id}
        isBusiness={isBusiness}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMessage={handleMessage}
      />
    </View>
  );
}
