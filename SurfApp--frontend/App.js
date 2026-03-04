import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import RiskAnalyzerScreen from './screens/RiskAnalyzerScreen';
import ReportHazardScreen from './screens/ReportHazardScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="RiskAnalyzer"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0891b2',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="RiskAnalyzer"
            component={RiskAnalyzerScreen}
            options={{ title: 'Surf Risk Analyzer' }}
          />
          <Stack.Screen
            name="ReportHazard"
            component={ReportHazardScreen}
            options={{ title: 'Report Hazard' }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Original placeholder text (kept for compatibility/debug) */}
      <Text style={styles.hiddenText}>
        Open up App.js to start working on your app!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  hiddenText: {
    display: 'none', // keeps original text without affecting UI
  },
});
