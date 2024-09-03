// app/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: 'home' | 'calendar' | 'user' = 'home';

          switch (route.name) {
            case '/':
              iconName = 'home';
              break;
            case '/competitions':
              iconName = 'calendar';
              break;
            case '/profile':
              iconName = 'user';
              break;
            default:
              iconName = 'home';
              break;
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        headerShown: false,
      })}
    >
      <Tabs.Screen name="/" options={{ title: 'Home' }} />
      <Tabs.Screen name="/competitions" options={{ title: 'Competitions' }} />
      <Tabs.Screen name="/profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
