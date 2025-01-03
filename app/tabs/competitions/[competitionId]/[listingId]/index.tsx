import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../../../firebase'; // Adjust this path as needed

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
  const { listingId } = useLocalSearchParams<{ listingId: string }>(); // Strongly type listingId
  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerUsername, setSellerUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, 'listings', listingId as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const listingData = docSnap.data() as Listing;
          setListing({
            id: listingId as string,
            name: listingData.name || 'Unnamed Listing',
            price: listingData.price || 0,
            imageUrl: listingData.imageUrl || '',
            puzzleType: listingData.puzzleType || 'Unknown',
            usage: listingData.usage || 'Unknown',
            description: listingData.description || '',
            userId: listingData.userId || 'Unknown',
          });

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

  const handleContactSeller = async () => {
    if (!auth.currentUser) {
      alert('You must be logged in to contact the seller.');
      router.push('/login');
      return;
    }

    const buyerId = auth.currentUser.uid;
    const sellerId = listing?.userId;

    const sortedIds = [buyerId, sellerId].sort();
    const conversationId = `${sortedIds[0]}_${sortedIds[1]}`;

    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      await setDoc(conversationRef, {
        participants: sortedIds,
        createdAt: serverTimestamp(),
        lastMessage: '',
        unreadBy: [sellerId],
      });
    }

    router.push(`/tabs/messages/${conversationId}`);
  };

  if (!listing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading listing details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <Image source={{ uri: listing.imageUrl }} style={styles.listingImage} />

          <View style={styles.card}>
            <Text style={styles.listingName}>{listing.name}</Text>
            <Text style={styles.listingDetail}>
              Puzzle Type: <Text style={styles.detailValue}>{listing.puzzleType}</Text>
            </Text>
            <Text style={styles.listingDetail}>
              Price: <Text style={styles.detailValue}>${listing.price}</Text>
            </Text>
            <Text style={styles.listingDetail}>
              Usage: <Text style={styles.detailValue}>{listing.usage}</Text>
            </Text>
            <Text style={styles.listingDetail}>Description:</Text>
            <TextInput
              value={listing.description}
              multiline
              style={styles.listingDescriptionInput}
              editable={false} // Make it non-editable unless required
            />
            <Text style={styles.listingDetail}>
              Seller: <Text style={styles.detailValue}>{sellerUsername}</Text>
            </Text>
          </View>

          {listing.userId !== auth.currentUser?.uid && (
            <Button title="Contact the Seller" onPress={handleContactSeller} color="#007BFF" />
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  listingName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  listingDetail: {
    fontSize: 16,
    marginBottom: 5,
  },
  detailValue: {
    fontWeight: 'bold',
  },
  listingDescriptionInput: {
    fontSize: 14,
    marginTop: 5,
    color: '#555',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
});

export default ListingDetails;
