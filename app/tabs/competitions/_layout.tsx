import React from 'react';
import { Stack } from 'expo-router';

export default function CompetitionStack() {
  return (
    <Stack>
      {/* Competitions List */}
      <Stack.Screen
        name="index"
        options={{ title: '', headerShown: false }}
      />

      {/* Specific Competition */}
      <Stack.Screen
        name="[competitionId]/index"
        options={{ title: '', headerShown: true }}
      />

      {/* Create New Listing */}
      <Stack.Screen
        name="[competitionId]/create-listing"
        options={{ title: '', headerShown: true }}
      />

      {/* Specific Listing */}
      <Stack.Screen
        name="[competitionId]/[listingId]/index"
        options={{ title: '', headerShown: true }}
      />
    </Stack>
  );
}
