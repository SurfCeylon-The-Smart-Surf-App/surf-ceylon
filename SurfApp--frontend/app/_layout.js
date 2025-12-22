import { Stack } from "expo-router";
import { View } from "react-native";
import { AuthProvider } from "../hooks/useAuth";
import { UserProvider } from "../context/UserContext";
import ActiveSessionBanner from "../components/ActiveSessionBanner";
import "../global.css";

export default function RootLayout() {
  return (
    <UserProvider>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <ActiveSessionBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </AuthProvider>
    </UserProvider>
  );
}
