import { MongoClient, ServerApiVersion, Collection } from "mongodb";
import { ScrapedData } from "../models/ScrapedData";

export class DatabaseService {
  private client: MongoClient | null = null;
  private collection: Collection<ScrapedData> | null = null;
  private dbName: string = process.env.MONGODB_DBNAME || "webscraper";

  private constructMongoUri(): string {
    const username = process.env.MONGODB_USERNAME;
    const password = process.env.MONGODB_PASSWORD;
    const cluster = process.env.MONGODB_CLUSTER;

    if (!username || !password || !cluster) {
      throw new Error(
        "Missing one or more of the required MongoDB environment variables: MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_CLUSTER"
      );
    }

    return `mongodb+srv://${username}:${password}@${cluster}/?retryWrites=true&w=majority&appName=Cluster0`;
  }

  async connect(): Promise<void> {
    if (this.client) return; // Already connected

    try {
      const uri = this.constructMongoUri();

      this.client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });

      await this.client.connect();
      await this.client.db(this.dbName).command({ ping: 1 });
      console.log("Successfully connected to MongoDB Atlas");

      const db = this.client.db(this.dbName);
      this.collection = db.collection<ScrapedData>("scrapedData");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log("MongoDB connection closed");
    }
  }

  getCollection(): Collection<ScrapedData> {
    if (!this.collection) throw new Error("Database not initialized");
    return this.collection;
  }

  async storeData(data: ScrapedData): Promise<void> {
    if (!this.collection) throw new Error("Database not initialized");
    await this.collection.insertOne(data);
  }
}
