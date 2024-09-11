import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';

interface Listing {
  id: string;
  name: string;
  details: string;
}

const Listings = () => {
  const { competitionId } = useLocalSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    axios.get(`https://example-api.com/competitions/${competitionId}/listings`)
      .then(response => {
        setListings(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching listings:', error);
        setLoading(false);
      });
  }, [competitionId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backButtonContainer}>
        <TouchableOpacity onPress={() => {
            console.log('Back button pressed');
            router.back();
        }} style={styles.hitbox}>
            <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Listings for Competition {competitionId}</Text>

      <FlatList
        data={listings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.listingItem}>
            <Text style={styles.listingName}>{item.name}</Text>
            <Text style={styles.listingDetails}>{item.details}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default Listings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 15,
    left: 20,
    zIndex: 10,
  },  
  hitbox: {
    padding: 8,  // Increase padding to make the hitbox larger
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  listingItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  listingName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listingDetails: {
    color: '#777',
  },
});