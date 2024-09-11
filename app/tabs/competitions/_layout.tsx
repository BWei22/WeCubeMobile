import React from 'react';
import { Stack } from 'expo-router';

export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Competitions List' }} />
      <Stack.Screen name="[competitionId]" options={{ title: 'This Competition' }} />
    </Stack>
  );
}
