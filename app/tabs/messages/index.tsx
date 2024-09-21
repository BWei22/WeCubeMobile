import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../../firebase'; // Adjust path to your Firebase config
import { useRouter } from 'expo-router';

// Define a type for the conversation structure
interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: {
    message: string;
    senderId: string;
    timestamp: any;
  };
}

interface User {
  username: string;
  photoURL: string;
}

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [usernames, setUsernames] = useState<{ [key: string]: { username: string; photoURL: string } }>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos: Conversation[] = [];
      const usernamesMap: { [key: string]: { username: string; photoURL: string } } = {};

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data() as Conversation;
        const conversationData = { ...data, id: docSnapshot.id };

        // Add conversation to list
        convos.push(conversationData);

        // Fetch usernames for participants (excluding the current user)
        const otherParticipantId = data.participants.find(id => id !== auth.currentUser?.uid);

        if (otherParticipantId && !usernamesMap[otherParticipantId]) {
          const userDocRef = doc(db, 'users', otherParticipantId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            usernamesMap[otherParticipantId] = {
              username: userData.username || 'Unknown',
              photoURL: userData.photoURL || 'https://via.placeholder.com/40',  // Default placeholder image
            };
          }
        }
      }

      setConversations(convos);
      setUsernames(prevState => ({ ...prevState, ...usernamesMap }));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleConversationClick = (conversation: Conversation) => {
    router.push(`/tabs/messages/${conversation.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const otherParticipantId = item.participants.find(id => id !== auth.currentUser?.uid);
        const otherParticipant = usernames[otherParticipantId || ''] || { username: 'Unknown', photoURL: 'https://via.placeholder.com/40' };

        return (
          <TouchableOpacity onPress={() => handleConversationClick(item)} style={styles.conversationItem}>
            <Image source={{ uri: otherParticipant.photoURL }} style={styles.profilePicture} />
            <View style={styles.conversationDetails}>
              <Text style={styles.username}>{otherParticipant.username}</Text>
              <Text style={styles.lastMessage}>
                {item.lastMessage?.message || 'No messages yet'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  conversationDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  lastMessage: {
    fontSize: 14,
    color: '#888',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
});

export default Messages;
