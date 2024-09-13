import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator, Alert, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Picker } from '@react-native-picker/picker';  // Import Picker
import * as ImagePicker from 'expo-image-picker';  // Import Image Picker
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
  const [image, setImage] = useState<string | null>(null);  // Image can be a URL or null
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleImageChange = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access media library is required.');
      return;
    }

    // Launch the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);  // Set the image URI to the state
    }
  };

  const handlePriceChange = (input: string) => {
    // Remove any characters that are not digits or a decimal point
    let sanitizedInput = input.replace(/[^0-9.]/g, '');
  
    // Prevent entering more than one decimal point
    const parts = sanitizedInput.split('.');
    if (parts.length > 2) {
      sanitizedInput = `${parts[0]}.${parts[1]}`; // Keep only one decimal point
    }
  
    // Restrict to two decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      sanitizedInput = `${parts[0]}.${parts[1].slice(0, 2)}`; // Limit to two decimal places
    }
  
    // If the input is empty, keep it empty (to allow clearing the input field)
    if (sanitizedInput === '') {
      setPrice('');
    } else {
      // Add a dollar sign and update the price
      setPrice(sanitizedInput);
    }
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      Alert.alert("You must be logged in to create a listing.");
      return;
    }

    if (!name || !puzzleType || !price || !usage) {
      Alert.alert("All fields except description must be filled out.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = '';
      if (image) {
        const storage = getStorage();
        const storageRef = ref(storage, `images/${Date.now()}_listing.jpg`); // Create a unique image name
        const response = await fetch(image);
        const blob = await response.blob();
        const uploadTask = uploadBytesResumable(storageRef, blob);

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
      const docRef = await addDoc(collection(db, 'listings'), {
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

      const listingId = docRef.id;  // Get the generated listing ID

      setLoading(false);
      Alert.alert("Listing created successfully!");

      // Navigate to the newly created listing's details page
      router.push(`/tabs/competitions/${competitionId}/${listingId}`);
    } catch (error) {
      console.error("Error creating listing: ", error);
      Alert.alert("Error creating listing. Please try again.");
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create a New Listing</Text>

      <TextInput
        placeholder="Puzzle Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Text style={styles.label}>Select Puzzle Type:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={puzzleType}
          onValueChange={(itemValue) => setPuzzleType(itemValue as string)}
        >
          {puzzleTypes.map((type, index) => (
            <Picker.Item key={index} label={type} value={type} />
          ))}
        </Picker>
      </View>

      <TextInput
        placeholder="Price"
        value={`$${price}`}
        onChangeText={handlePriceChange}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Select Usage:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={usage}
          onValueChange={(itemValue) => setUsage(itemValue as string)}
        >
          {usageOptions.map((option, index) => (
            <Picker.Item key={index} label={option} value={option} />
          ))}
        </Picker>
      </View>

      <TextInput
        placeholder="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity onPress={handleImageChange} style={styles.imageButton}>
        <Text style={styles.imageButtonText}>Choose Image</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

      {loading ? <ActivityIndicator size="large" color="#0000ff" /> : (
        <Button title="Submit Listing" onPress={handleSubmit} color="#007BFF" />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
  },
  imageButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  imagePreview: {
    height: 100,
    width: 100,
    marginBottom: 20,
    borderRadius: 5,
  },
});

export default CreateListing;
