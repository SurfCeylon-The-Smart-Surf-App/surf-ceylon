import { Stack } from "expo-router";

export default function SpotsLayout() {
  return (
    <Stack>
      <Stack.Screen name="detail" options={{ title: "Spot Details" }} />
    </Stack>
  );
}
