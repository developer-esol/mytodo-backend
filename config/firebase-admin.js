const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

// Initialize Firebase Admin with error handling
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://todo-851bd.firebaseio.com",
  });
  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  process.exit(1); // Exit if Firebase fails to initialize
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = {admin, db, auth};
