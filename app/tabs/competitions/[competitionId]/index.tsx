import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase'; // Adjust this path as needed

// Define the Listing interface
interface Listing {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  puzzleType: string;
  usage: string;
  description: string;
  userId: string;
  createdAt: number;
}

const Listings = () => {
  const { competitionId } = useLocalSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'listings'), where('competitionId', '==', competitionId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listingsData = snapshot.docs.map(doc => {
        const data = doc.data();

        // Make sure all required fields are present
        return {
          id: doc.id,
          name: data.name || 'Unnamed',  // Fallback if name is missing
          price: data.price || 0,  // Fallback if price is missing
          imageUrl: data.imageUrl || '',
          puzzleType: data.puzzleType || 'Unknown',
          usage: data.usage || 'Unknown',
          description: data.description || '',
          userId: data.userId || 'Unknown',
          createdAt: data.createdAt || Date.now(),
        } as Listing;  // Explicitly cast to Listing type
      });

      setListings(listingsData);
      setLoading(false);
    }, error => {
      console.error('Error fetching listings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [competitionId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading listings...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button
        title="Create New Listing"
        onPress={() => router.push(`/tabs/competitions/${competitionId}/create-listing`)}
      />
      
      <FlatList
        data={listings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/tabs/competitions/${competitionId}/${item.id}`)}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
            <Text>${item.price}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default Listings;
