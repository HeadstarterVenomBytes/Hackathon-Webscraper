import { Database } from "../database";
import { MongoClient, Db, Collection } from "mongodb";
import { ScrapedData } from "../types";

jest.mock("mongodb");

describe("Database", () => {
  let database: Database;
  let mockCollection: jest.Mocked<Collection<ScrapedData>>;
  let mockDb: jest.Mocked<Db>;
  let mockClient: jest.Mocked<MongoClient>;

  beforeEach(() => {
    // Create mock implementations
    mockCollection = {
      insertOne: jest.fn(),
    } as unknown as jest.Mocked<Collection<ScrapedData>>;

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as unknown as jest.Mocked<Db>;

    mockClient = {
      connect: jest.fn(),
      db: jest.fn().mockReturnValue(mockDb),
      close: jest.fn(),
    } as unknown as jest.Mocked<MongoClient>;

    // Mock the MongoClient constructor
    (MongoClient as unknown as jest.Mock).mockImplementation(() => mockClient);

    database = new Database("username", "password", "cluster", "dbname");
  });

  test("connect should establish a database connection", async () => {
    await database.connect();
    expect(mockClient.connect).toHaveBeenCalled();
  });

  test("close should close the database connection", async () => {
    await database.connect();
    await database.close();
    expect(mockClient.close).toHaveBeenCalled();
  });

  test("storeData should insert data into the collection", async () => {
    await database.connect();
    const mockData: ScrapedData = {
      url: "https://example.com",
      title: "Example",
      description: "An example website",
      keywords: ["example", "test"],
      h1Headers: ["Welcome"],
      paragraphs: ["This is a paragraph"],
      links: [
        { href: "https://example.com/page", text: "Page", isInternal: true },
      ],
      images: [{ src: "image.jpg", alt: "An image", width: 100, height: 100 }],
      lastModified: null,
      contentLength: null,
      statusCode: 200,
      timestamp: new Date(),
    };
    await database.storeData(mockData);
    expect(mockCollection.insertOne).toHaveBeenCalledWith(mockData);
  });
});
