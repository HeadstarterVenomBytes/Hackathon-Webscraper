import { MongoClient, ServerApiVersion, Collection } from "mongodb";
import { ScrapedData } from "./types";

export class Database {
  private client: MongoClient | null = null;
  private collection: Collection<ScrapedData> | null = null;

  constructor(
    private username: string,
    private password: string,
    private cluster: string,
    private dbName: string = "webscraper",
  ) {}

  private constructUri(): string {
    return `mongodb+srv://${this.username}:${this.password}@${this.cluster}/?retryWrites=true&w=majority&appName=Cluster0`;
  }

  async connect(): Promise<void> {
    try {
      const uri = this.constructUri();
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
}
