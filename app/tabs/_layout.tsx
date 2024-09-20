import React from 'react';
import { Tabs } from 'expo-router';

export default function MyTabs() {
  return (
    <Tabs>
      <Tabs.Screen name="competitions" options={{ title: 'Competitions' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
    </Tabs>
  );
}
