import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

admin.initializeApp();

interface MessageData {
  senderId: string;
  recipientId: string;
  message: string;
}

export const sendNewMessageNotification = onDocumentCreated(
  { document: "messages/{messageId}" }, // ✅ Firestore trigger path
  async (event) => {
    console.log("New message created:", event.params.messageId);

    const snapshot: QueryDocumentSnapshot | null = event.data ?? null; // 🔥 Fix applied here

    if (!snapshot) {
      console.error("No snapshot data found.");
      return;
    }

    const messageData = snapshot.data() as MessageData;
    if (!messageData) {
      console.error("Invalid message data.");
      return;
    }

    const { senderId, recipientId, message } = messageData;

    // 🔍 Get recipient FCM token
    const recipientDoc = await admin.firestore().collection("users").doc(recipientId).get();
    const recipientData = recipientDoc.data();
    const recipientToken = recipientData?.fcmToken;

    if (!recipientDoc.exists || !recipientToken) {
      console.warn("Recipient does not exist or has no valid FCM token.");
      return;
    }

    // 🔍 Get sender username
    const senderDoc = await admin.firestore().collection("users").doc(senderId).get();
    const senderName = senderDoc.exists ? senderDoc.data()?.username || "Someone" : "Someone";

    // 📩 Push Notification Payload
    const payload = {
      token: recipientToken,
      notification: {
        title: `${senderName} sent you a message`,
        body: message,
      },
    };

    try {
      await admin.messaging().send(payload);
      console.log(`✅ Push notification sent to ${recipientId} from ${senderId}`);
    } catch (error) {
      console.error("❌ Error sending push notification:", error);
    }
  }
);
