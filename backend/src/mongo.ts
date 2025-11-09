import { MongoClient } from 'mongodb';

let mongoClient: MongoClient | null = null;

export const getMongoClient = async (): Promise<MongoClient> => {
  if (!mongoClient) {
    mongoClient = await MongoClient.connect(process.env.MONGODB_URI || '');
  }
  return mongoClient;
};
