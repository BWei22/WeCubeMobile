import React from 'react';
import { Stack } from 'expo-router';

export default function DetailsStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Details Screen' }} />
      <Stack.Screen name="[listingId]" options={{ title: 'Listings' }} /> 
    </Stack>
  );
}
