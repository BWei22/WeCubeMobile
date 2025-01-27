import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  LayoutAnimation,
  Platform,
  EmitterSubscription,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  getDoc,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../../../firebase';

interface Message {
  senderId: string;
  message: string;
  recipientId: string;
  timestamp: any;
  isRead: boolean;
}

const MessageScreen = () => {
  const { messageId } = useLocalSearchParams<{ messageId: string }>();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientProfilePicture, setRecipientProfilePicture] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  // Synchronous Keyboard Movement
  useEffect(() => {
    let showListener: EmitterSubscription;
    let hideListener: EmitterSubscription;

    if (Platform.OS === 'ios') {
      showListener = Keyboard.addListener('keyboardWillShow', (event) => {
        setKeyboardHeight(event.endCoordinates.height - 114);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      });

      hideListener = Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      });
    } else {
      showListener = Keyboard.addListener('keyboardDidShow', (event) => {
        setKeyboardHeight(event.endCoordinates.height - 114);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      });

      hideListener = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      });
    }

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!messageId) {
      console.error('Message ID not provided!');
      return;
    }

    const fetchConversationDetails = async () => {
      try {
        const conversationRef = doc(db, 'conversations', messageId as string);
        const conversationSnap = await getDoc(conversationRef);

        if (conversationSnap.exists()) {
          const conversationData = conversationSnap.data();
          const participants = conversationData.participants;

          const otherUserId = participants.find((id: string) => id !== auth.currentUser?.uid);
          setRecipientId(otherUserId);

          const recipientDocRef = doc(db, 'users', otherUserId);
          const recipientDocSnap = await getDoc(recipientDocRef);

          if (recipientDocSnap.exists()) {
            setRecipientUsername(recipientDocSnap.data().username || 'Unknown');
            setRecipientProfilePicture(recipientDocSnap.data().photoURL || null);
          }
        }
      } catch (error) {
        console.error('Error fetching recipient details:', error);
      }

      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', messageId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const msgsData = snapshot.docs.map((doc) => ({
          senderId: doc.data().senderId,
          message: doc.data().message,
          recipientId: doc.data().recipientId,
          timestamp: doc.data().timestamp,
          isRead: doc.data().isRead,
        }));

        setMsgs(msgsData);
      });

      return () => unsubscribe();
    };

    fetchConversationDetails();
  }, [messageId]);

  const handleSendMessage = async () => {
    if (!auth.currentUser) {
      console.error('User not authenticated');
      return;
    }

    try {
      const messageData: Message = {
        senderId: auth.currentUser.uid,
        message: newMessage,
        recipientId: recipientId,
        timestamp: serverTimestamp() as any,
        isRead: false,
      };

      await addDoc(collection(db, 'messages'), {
        ...messageData,
        conversationId: messageId,
      });

      const conversationRef = doc(db, 'conversations', messageId as string);
      await updateDoc(conversationRef, {
        lastMessage: messageData,
        unreadBy: [recipientId],
      });

      setNewMessage('');
      setIsUserScrolling(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };

  return (

      <View style={styles.container}>
        <View style={styles.profileHeader}>
          {recipientProfilePicture ? (
            <Image source={{ uri: recipientProfilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder} />
          )}
          <Text style={styles.profileUsername}>{recipientUsername}</Text>
        </View>
            
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageContainer}
          contentContainerStyle={{
            paddingBottom: keyboardHeight + 60,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (!isUserScrolling) {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }}
          onScrollBeginDrag={() => setIsUserScrolling(true)}
          onScrollEndDrag={() => setIsUserScrolling(false)}
        >
          {msgs.length === 0 ? (
            <ActivityIndicator size="large" color="#007BFF" />
          ) : (
            msgs.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  msg.senderId === auth.currentUser?.uid ? styles.sentMessage : styles.receivedMessage,
                ]}
              >
                <Text style={styles.messageText}>{msg.message}</Text>
                {msg.timestamp ? (
                  <Text style={styles.timestamp}>
                    {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString()}
                  </Text>
                ) : (
                  <Text style={styles.timestamp}>Time not available</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { bottom: keyboardHeight }]}>
          <TextInput
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.textInput}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            style={styles.sendButton}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profilePicturePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 10,
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageContainer: {
    flex: 1,
  },
  messageBubble: {
    marginVertical: 8,
    maxWidth: '80%',
    borderRadius: 15,
    padding: 10,
  },
  sentMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  receivedMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 5,
  },
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  textInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    borderRadius: 20,
    marginLeft: 10,
    paddingHorizontal: 15,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MessageScreen;
