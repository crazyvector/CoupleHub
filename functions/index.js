const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendPushNotification = onDocumentCreated(
  "couples/{coupleId}/notifications/{notificationId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const coupleId = event.params.coupleId;

    // Get the target role
    // If targetRole is explicitly set, use it. Otherwise guess based on sender
    const targetRole = data.targetRole || (data.sender === "his" ? "her" : "his");

    try {
      // Get the target's FCM token from their profile
      const profileRef = admin.firestore().doc(`couples/${coupleId}/profiles/${targetRole}`);
      const profileSnap = await profileRef.get();

      if (!profileSnap.exists) {
        console.log(`Profile for role ${targetRole} not found in couple ${coupleId}`);
        return null;
      }

      const profileData = profileSnap.data();
      const fcmToken = profileData.fcmToken;

      if (!fcmToken) {
        console.log(`No FCM token found for role ${targetRole} in couple ${coupleId}`);
        return null;
      }

      // Create the payload for the push notification
      const message = {
        token: fcmToken,
        notification: {
          title: data.title || "Nouă Notificare!",
          body: data.body || "Ai primit ceva nou în CoupleHub.",
        },
        data: {
          notificationId: event.params.notificationId,
          type: "in-app-notification",
        },
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "default",
          },
        },
      };

      // Send the message using Firebase Admin
      const response = await admin.messaging().send(message);
      console.log(`Successfully sent push notification to ${targetRole}:`, response);
      return response;
    } catch (error) {
      console.error(`Error sending push notification to ${targetRole}:`, error);
      return null;
    }
  }
);
