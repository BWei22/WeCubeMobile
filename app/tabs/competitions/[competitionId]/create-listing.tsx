import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, auth } from '../../../../firebase'; // Adjust this import path

const puzzleTypes = [
  "3x3", "2x2", "4x4", "5x5", "6x6", "7x7", 
  "Megaminx", "Pyraminx", "Skewb", "Square-1", 
  "Clock", "Non-WCA", "Miscellaneous"
];

const usageOptions = ["New", "Like New", "Used"];

const CreateListing = () => {
  const { competitionId } = useLocalSearchParams();
  const [name, setName] = useState<string>('');  // Correct type definition
  const [puzzleType, setPuzzleType] = useState<string>(puzzleTypes[0]);
  const [price, setPrice] = useState<string>('');  // Correct type definition for price
  const [usage, setUsage] = useState<string>(usageOptions[0]);
  const [description, setDescription] = useState<string>('');  // Description type as string
  const [image, setImage] = useState<File | null>(null);  // Image can be null or a file
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleImageChange = async (e: any) => {
    const selectedImage = e.target.files[0];
    if (selectedImage) {
      setImage(selectedImage);
    }
  };

  const handlePriceChange = (input: string) => {
    const sanitizedInput = input.replace(/[^0-9.]/g, ''); // Sanitize price input to remove non-numeric characters
    setPrice(sanitizedInput);
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      Alert.alert("You must be logged in to create a listing.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = '';
      if (image) {
        const storage = getStorage();
        const storageRef = ref(storage, `images/${image.name}`);
        const uploadTask = uploadBytesResumable(storageRef, image);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            reject,
            async () => {
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      // Add the listing to Firestore
      await addDoc(collection(db, 'listings'), {
        name,
        puzzleType,
        price,
        usage,
        description,
        imageUrl,
        competitionId,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setLoading(false);
      Alert.alert("Listing created successfully!");
      router.back();  // Navigate back to the competition page
    } catch (error) {
      console.error("Error creating listing: ", error);
      Alert.alert("Error creating listing. Please try again.");
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text>Create a New Listing for Competition</Text>

      <TextInput
        placeholder="Puzzle Name"
        value={name}
        onChangeText={setName}
        style={{ borderBottomWidth: 1, marginBottom: 20 }}
      />

      <Text>Select Puzzle Type:</Text>
      <TextInput
        placeholder="Puzzle Type"
        value={puzzleType}
        onChangeText={setPuzzleType}
        style={{ borderBottomWidth: 1, marginBottom: 20 }}
      />

      <TextInput
        placeholder="Price"
        value={price}
        onChangeText={handlePriceChange}
        keyboardType="numeric"
        style={{ borderBottomWidth: 1, marginBottom: 20 }}
      />

      <Text>Select Usage:</Text>
      <TextInput
        placeholder="Usage"
        value={usage}
        onChangeText={setUsage}
        style={{ borderBottomWidth: 1, marginBottom: 20 }}
      />

      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={{ borderBottomWidth: 1, marginBottom: 20 }}
      />

      <Button title="Choose Image" onPress={handleImageChange} />
      {image && <Image source={{ uri: URL.createObjectURL(image) }} style={{ height: 100, width: 100 }} />}

      {loading ? <ActivityIndicator size="large" color="#0000ff" /> : (
        <Button title="Submit Listing" onPress={handleSubmit} />
      )}
    </ScrollView>
  );
};

export default CreateListing;
