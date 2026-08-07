import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

const authUsers = JSON.parse(fs.readFileSync('auth_users.json', 'utf8'));
const uids = authUsers.users.map(u => u.localId);

if (uids.length === 0) {
  console.log("No users to delete.");
  process.exit(0);
}

console.log(`Attempting to delete ${uids.length} users...`);

try {
  // If no GOOGLE_APPLICATION_CREDENTIALS, this might fail, but let's try
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: 'couplehub-17d57'
  });
  
  const auth = getAuth(app);
  const result = await auth.deleteUsers(uids);
  
  console.log(`Successfully deleted ${result.successCount} users.`);
  if (result.failureCount > 0) {
    console.log(`Failed to delete ${result.failureCount} users.`);
    result.errors.forEach(err => console.error(err.error.toJSON()));
  }
} catch (error) {
  console.error("Error deleting users:", error.message);
  console.error("\nTo delete these users, you can use the Firebase Console (Authentication tab) or set GOOGLE_APPLICATION_CREDENTIALS.");
}
