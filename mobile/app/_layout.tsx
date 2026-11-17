import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ComponentProps } from 'react';
import { colors } from '../src/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
const tabIcon = (name: IconName) => ({ color, size }: { color: unknown; size: number }) => (
  <Ionicons name={name} size={size} color={typeof color === 'string' ? color : colors.primary} />
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
          <Tabs.Screen
            name="index"
            options={{ title: 'Dashboard', tabBarIcon: tabIcon('speedometer-outline') }}
          />
          <Tabs.Screen
            name="classes"
            options={{ title: 'Classes', tabBarIcon: tabIcon('calendar-outline') }}
          />
        </Tabs>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
