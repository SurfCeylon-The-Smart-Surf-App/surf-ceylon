const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add .glb files as recognized asset types
config.resolver.assetExts.push("glb", "gltf", "bin", "obj");

module.exports = withNativeWind(config, { input: "./global.css" });
