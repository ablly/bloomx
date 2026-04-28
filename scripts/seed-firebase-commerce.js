const admin = require('firebase-admin');

const projectId = process.argv[2] || process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error('Usage: node scripts/seed-firebase-commerce.js <firebase-project-id>');
  process.exit(1);
}

admin.initializeApp({ projectId });

const db = admin.firestore();

async function seed() {
  const offerRef = db.collection('apiOffers').doc('demo-xianyu-chat');

  await offerRef.set(
    {
      ownerId: 'demo-seller',
      sellerName: 'Demo Verified Supplier',
      modelName: 'xianyu-demo-chat',
      category: 'chat',
      endpoint: 'https://example.com/demo-model',
      authHeader: 'Authorization',
      pricePerCall: 1,
      description: 'Demo listing for validating marketplace subscription and credit flow.',
      status: 'listed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log('Seeded apiOffers/demo-xianyu-chat');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
