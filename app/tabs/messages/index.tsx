import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]); // Correct type for conversations array
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos: Conversation[] = []; // Declare an array of Conversation type
      snapshot.forEach((doc) => {
        const data = doc.data() as Conversation;
        const conversationData = { ...data, id: doc.id }; // Ensure id is set only once
        convos.push(conversationData);
      });
      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleConversationClick = (conversation: Conversation) => {
    router.push(`/tabs/messages/${conversation.id}`);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {conversations.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No messages yet!</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleConversationClick(item)}>
              <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
                <Text style={{ fontSize: 18 }}>
                  Conversation with {item.participants.filter(id => id !== auth.currentUser?.uid).join(', ')}
                </Text>
                <Text>
                  {item.lastMessage?.message || 'No messages yet'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default Messages;
