const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");
const logger = require("./logger");

// Initialize Firebase Admin with error handling
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://todo-851bd.firebaseio.com",
  });
  logger.info("Firebase Admin initialized successfully", {
    file: "config/firebase-admin.js",
    function: "initialization",
  });
} catch (error) {
  logger.error("Firebase Admin initialization failed", {
    file: "config/firebase-admin.js",
    function: "initialization",
    error: error.message,
    stack: error.stack,
  });
  process.exit(1); // Exit if Firebase fails to initialize
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
