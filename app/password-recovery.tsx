// app/password-recovery.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity } from 'react-native';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function PasswordRecovery() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handlePasswordRecovery = () => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setMessage('Password reset email sent!');
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'fff' }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>Password Recovery</Text>
      
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ marginBottom: 20, padding: 10, borderWidth: 1, borderRadius: 5 }}
      />
      
      {message ? <Text style={{ color: 'green', marginBottom: 20 }}>{message}</Text> : null}
      {error ? <Text style={{ color: 'red', marginBottom: 20 }}>{error}</Text> : null}
      
      <Button title="Reset Password" onPress={handlePasswordRecovery} />

      <TouchableOpacity onPress={() => router.push('/login')} style={{ marginTop: 20 }}>
        <Text style={{ color: 'blue', textAlign: 'center' }}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}