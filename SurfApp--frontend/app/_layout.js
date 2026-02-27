import { Stack } from "expo-router";
import { View } from "react-native";
import { AuthProvider } from "../hooks/useAuth";
import { UserProvider } from "../context/UserContext";
import { CardioProfileProvider } from "../context/CardioProfileContext";
import ActiveSessionBanner from "../components/ActiveSessionBanner";
import "../global.css";

export default function RootLayout() {
  return (
    <UserProvider>
      <AuthProvider>
        <CardioProfileProvider>
          <View style={{ flex: 1 }}>
            <ActiveSessionBanner />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="arExperience" />
              <Stack.Screen name="arViewer" />
            </Stack>
          </View>
        </CardioProfileProvider>
      </AuthProvider>
    </UserProvider>
  );
}
