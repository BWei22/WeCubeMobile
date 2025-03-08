import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Platform,
  LayoutAnimation,
  UIManager,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener('keyboardWillShow', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });

    const keyboardHideListener = Keyboard.addListener('keyboardWillHide', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        console.log('Login successful, navigating to home page...');
        router.replace('/tabs/competitions');
      })
      .catch((error) => {
        let errorMessage = 'An unexpected error occurred. Please try again.';
  
        if (error.code) {
          switch (error.code) {
            case 'auth/invalid-email':
              errorMessage = 'Please enter a valid email address.';
              break;
            case 'auth/missing-password':
              errorMessage = 'Please enter your password.';
              break;
            case 'auth/email-already-exists':
              errorMessage = 'This email is already associated with an account. Please log in.';
              break;
            case 'auth/user-disabled':
              errorMessage = 'This account has been disabled. Contact support for help.';
              break;
            case 'auth/user-not-found':
              errorMessage = 'No account found with this email. Please sign up first.';
              break;
            case 'auth/wrong-password':
              errorMessage = 'Incorrect password. Please try again.';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Too many login attempts. Please try again later.';
              break;
            case 'auth/network-request-failed':
              errorMessage = 'Network error. Please check your internet connection.';
              break;
            case 'auth/id-token-expired':
              errorMessage = 'Your session has expired. Please log in again.';
              break;
            case 'auth/id-token-revoked':
              errorMessage = 'Your session has been revoked. Please log in again.';
              break;
            case 'auth/invalid-credential':
              errorMessage = 'Invalid credentials. Please try again.';
              break;
            case 'auth/invalid-password':
              errorMessage = 'Your password must be at least six characters long.';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'Sign-in method is currently disabled. Please contact support.';
              break;
            case 'auth/session-cookie-expired':
              errorMessage = 'Your session has expired. Please log in again.';
              break;
            case 'auth/session-cookie-revoked':
              errorMessage = 'Your session has been revoked. Please log in again.';
              break;
            case 'auth/unauthorized-continue-uri':
              errorMessage = 'Invalid redirect. Please check your login method.';
              break;
            case 'auth/internal-error':
              errorMessage = 'Internal server error. Please try again later.';
              break;
            default:
              console.log('Login failed:', error.message);
          }
        }
  
        setError(errorMessage);
      });
  };
  
  

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.inner}>
            {/* Title and Subtitle (Grouped for Sync Movement) */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Log in to continue</Text>
            </View>

            {/* Input Fields */}
            <TextInput
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <TextInput
              placeholder="Password"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>

            {/* Links */}
            <TouchableOpacity onPress={() => router.replace('/password-recovery')} style={styles.link}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/signup')} style={styles.link}>
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.signupText}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

/* 💡 Updated Styles with Grouped Header */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
  },
  headerContainer: {
    alignItems: 'center', // Keeps title & subtitle centered
    marginBottom: 30, // Provides space before inputs
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  input: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    backgroundColor: '#fff',
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#555',
    fontSize: 16,
  },
  signupText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
});

export default Login;
