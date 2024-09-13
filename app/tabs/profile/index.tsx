import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '../../../firebase.js'; // Adjust this path according to your project structure
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const user = auth.currentUser;

  // Fetch current user profile data from Firestore and auth
  const fetchUserProfile = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || '');
          setProfilePicture(userData.photoURL || null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  // Call fetchUserProfile when the component is mounted
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleUsernameChange = async () => {
    if (user && username) {
      await updateProfile(user, {
        displayName: username,
      });
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, { username });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const handleProfilePictureChange = async () => {
    if (user && profilePicture) {
      setUploading(true);
      const response = await fetch(profilePicture);
      const blob = await response.blob();
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, blob);

      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL });
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, { photoURL });

      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await handleUsernameChange();
      await handleProfilePictureChange();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'There was an error updating the profile. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <TouchableOpacity onPress={pickImage}>
        {profilePicture ? (
          <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
        ) : (
          <View style={styles.profilePicturePlaceholder}>
            <Text>Select Profile Picture</Text>
          </View>
        )}
      </TouchableOpacity>

      <Button title={uploading ? "Saving..." : "Save Changes"} onPress={handleSave} disabled={uploading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
});
