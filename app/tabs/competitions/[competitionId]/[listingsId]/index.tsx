import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../../../firebase';  // Adjust this path as needed

interface Listing {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  puzzleType: string;
  usage: string;
  description: string;
  userId: string;
}

const ListingDetails = () => {
  const { listingId } = useLocalSearchParams();  // Get listingId from the route
  const [listing, setListing] = useState<Listing | null>(null);  // Define the correct type for listing
  const [sellerUsername, setSellerUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, 'listings', listingId as string);  // Ensure listingId is passed as a string
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const listingData = docSnap.data() as Listing;  // Cast the document data to Listing type
          setListing(listingData);

          // Fetch the seller's username
          const userDocRef = doc(db, 'users', listingData.userId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setSellerUsername(userDocSnap.data().username);
          } else {
            setSellerUsername('Unknown');
          }
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      }
    };

    fetchListing();
  }, [listingId]);

  if (!listing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading listing details...</Text>
      </View>
    );
  }

  const handleContactSeller = async () => {
    if (!auth.currentUser) {
      alert('You must be logged in to contact the seller.');
      router.push('/login');  // Redirect to the login page if the user is not authenticated
      return;
    }

    const conversationId = `${listingId}_${auth.currentUser.uid}_${listing.userId}`;

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        await setDoc(conversationRef, {
          listingId,
          participants: [auth.currentUser.uid, listing.userId],
          createdAt: serverTimestamp(),
          lastMessage: '',
          unreadBy: [listing.userId],
        });
      }

      //router.push(`/conversations?selected=${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Back" onPress={() => router.back()} />
      <Image source={{ uri: listing.imageUrl }} style={{ height: 200, width: '100%' }} />
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{listing.name}</Text>
      <Text>Puzzle Type: {listing.puzzleType}</Text>
      <Text>Price: ${listing.price}</Text>
      <Text>Usage: {listing.usage}</Text>
      <Text>Description: {listing.description}</Text>
      <Text>Seller: {sellerUsername}</Text>
      {listing.userId !== auth.currentUser?.uid && (
        <Button title="Contact the Seller" onPress={handleContactSeller} />
      )}
    </View>
  );
};

export default ListingDetails;
