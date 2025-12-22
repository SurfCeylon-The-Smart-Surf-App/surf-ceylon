import { Stack } from "expo-router";
import { AuthProvider } from "../hooks/useAuth";
import { UserProvider } from "../context/UserContext";
import "../global.css";

export default function RootLayout() {
  return (
    <UserProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </UserProvider>
  );
}
