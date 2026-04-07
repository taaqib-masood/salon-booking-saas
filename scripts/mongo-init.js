```javascript
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('myDatabase');
    
    // Create application user
    const appUser = 'appUser';
    const password = process.env.MONGO_APPUSER_PASSWORD;
    await db.addUser(appUser, password, { roles: ['readWrite'] });
    
    // Create indexes
    const collection1 = db.collection('Collection1');
    await collection1.createIndex({ tenant: 1, phone: 1 }, { unique: true });
    await collection1.createIndex({ Service: 'text' });
    await collection1.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // TTL index
    
    const collection2 = db.collection('Collection2');
    await collection2.createIndex({ tenant: 1, phone: 1 }, { unique: true });
    await collection2.createIndex({ Service: 'text' });
    await collection2.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // TTL index
    
    // Add schema validation for Appointment and Customer
    const appointmentSchema = {
      $jsonSchema: {
        bsonType: 'object',
        required: ['tenant', 'phone'],
        properties: {
          tenant: {
            bsonType: 'string'
          },
          phone: {
            bsonType: 'string'
          }
        }
      }
    };
    
    const customerSchema = {
      $jsonSchema: {
        bsonType: 'object',
        required: ['tenant', 'phone'],
        properties: {
          tenant: {
            bsonType: 'string'
          },
          phone: {
            bsonType: 'string'
          }
        }
      }
    };
    
    await db.command({ collMod: 'Appointment', validator: appointmentSchema });
    await db.command({ collMod: 'Customer', validator: customerSchema });
    
    // Seed default service categories
    const services = ['Service1', 'Service2', 'Service3'];
    for (const service of services) {
      await db.collection('services').insertOne({ name: service });
    }
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
```