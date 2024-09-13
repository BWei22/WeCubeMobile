import React, { useState } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase';  // Adjust this import based on your firebase setup
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';  // Firestore functions

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Function to generate the username based on account creation timestamp
  const generateUsername = () => {
    const timestamp = Date.now();
    return `user${timestamp}`;
  };

  const handleSignUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;

        // Generate a unique username based on the timestamp
        const username = generateUsername();

        // Store the user data along with the generated username in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          username: username,
          createdAt: serverTimestamp(),
        });

        // Navigate to home page after signup
        router.replace('/');
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>Sign Up</Text>
      
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ marginBottom: 20, padding: 10, borderWidth: 1, borderRadius: 5 }}
      />
      
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 20, padding: 10, borderWidth: 1, borderRadius: 5 }}
      />
      
      {error ? <Text style={{ color: 'red', marginBottom: 20 }}>{error}</Text> : null}
      
      <Button title="Sign Up" onPress={handleSignUp} />

      <TouchableOpacity onPress={() => router.replace('/login')} style={{ marginTop: 20 }}>
        <Text style={{ color: 'blue', textAlign: 'center' }}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}
