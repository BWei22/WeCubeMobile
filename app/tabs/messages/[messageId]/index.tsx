import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Button, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, collection, query, where, onSnapshot, addDoc, updateDoc, getDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../../firebase';  // Adjust this path as needed

interface Message {
  senderId: string;
  message: string;
  recipientId: string;
  timestamp: number;
  isRead: boolean;
}

const MessageScreen = () => {
  const { messageId } = useLocalSearchParams<{ messageId: string }>();
  const [msgs, setMsgs] = useState<Message[]>([]);  // Define the correct type for msgs
  const [newMessage, setNewMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);  // Ref for ScrollView to implement scrollToEnd
  const router = useRouter();

  useEffect(() => {
    if (!messageId) {
      console.error('Message ID not provided!');
      return;
    }

    const fetchMessages = async () => {
      try {
        const docRef = doc(db, 'messages', messageId as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRecipientId(docSnap.data().recipientId);
        }
      } catch (error) {
        console.error('Error fetching recipient ID:', error);
      }

      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', messageId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const msgsData = snapshot.docs.map(doc => ({
          senderId: doc.data().senderId,
          message: doc.data().message,
          recipientId: doc.data().recipientId,
          timestamp: doc.data().timestamp,
          isRead: doc.data().isRead,
        }));
        setMsgs(msgsData);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });

      return () => unsubscribe();
    };

    fetchMessages();
  }, [messageId]);

  const handleSendMessage = async () => {
    if (!auth.currentUser) {
      console.error('User not authenticated');
      return;
    }

    try {
      const currentRecipientId = recipientId;

      const messageData: Message = {
        senderId: auth.currentUser.uid,
        message: newMessage,
        recipientId: currentRecipientId,
        timestamp: serverTimestamp() as any,  // casting as any for simplicity with Firebase timestamps
        isRead: false,
      };

      // Add the new message to the messages collection
      await addDoc(collection(db, 'messages'), {
        ...messageData,
        conversationId: messageId,
      });

      // Update the last message in the conversation document
      const conversationRef = doc(db, 'conversations', messageId as string);
      await updateDoc(conversationRef, {
        lastMessage: messageData,
        unreadBy: [currentRecipientId],  // Mark the recipient as having unread messages
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  if (!messageId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No conversation selected</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <ScrollView ref={scrollViewRef} style={{ flex: 1 }}>
        {msgs.length === 0 ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          msgs.map((msg, index) => (
            <View key={index} style={{ marginVertical: 10, padding: 10, backgroundColor: msg.senderId === auth.currentUser?.uid ? '#dcf8c6' : '#fff' }}>
              <Text>{msg.message}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <TextInput
        placeholder="Type a message"
        value={newMessage}
        onChangeText={setNewMessage}
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />

      <Button title="Send" onPress={handleSendMessage} disabled={!newMessage.trim()} />
    </View>
  );
};

export default MessageScreen;
