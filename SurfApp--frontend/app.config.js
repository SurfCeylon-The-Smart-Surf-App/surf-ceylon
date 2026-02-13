export default {
  expo: {
    name: "Surf Risk Analyzer",
    slug: "surf-risk-analyzer",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera.",
        }
      ]
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.surfrisks.app",
      infoPlist: {
        NSCameraUsageDescription: "This app needs camera access to report hazards with photos",
        NSPhotoLibraryUsageDescription: "This app needs photo library access to upload hazard photos"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.surfrisks.app",
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || '',
    }
  }
};