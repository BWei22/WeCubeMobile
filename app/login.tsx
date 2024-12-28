// app/login.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        console.log("Login successful, navigating to home page...");
        router.replace('/tabs/competitions');
      })
      .catch((error) => {
        setError(error.message);
        console.log("Login failed:", error.message);
      });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>Login</Text>
      
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
      
      <Button title="Login" onPress={handleLogin} />

      <TouchableOpacity onPress={() => router.replace('/password-recovery')} style={{ marginTop: 20 }}>
        <Text style={{ color: 'blue', textAlign: 'center' }}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/signup')} style={{ marginTop: 20 }}>
        <Text style={{ color: 'blue', textAlign: 'center' }}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}