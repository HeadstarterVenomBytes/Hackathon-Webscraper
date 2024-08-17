import { WebScraper } from "./scraper";
import { Database } from "./database";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_CLUSTER = process.env.MONGODB_CLUSTER;

if (!MONGODB_USERNAME || !MONGODB_PASSWORD || !MONGODB_CLUSTER) {
  throw new Error("Please define all required MongoDB environment variables");
}

interface Config {
  urlsToScrape: string[];
  maxUrls: number;
  dbName: string;
}

function loadConfig(): Config {
  const configPath = path.join(__dirname, "..", "config.json");

  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(configFile);
  }

  return {
    urlsToScrape: [],
    maxUrls: 50,
    dbName: "webscraper",
  };
}

function parseCommandLineArgs(): string[] {
  return process.argv.slice(2);
}

async function main() {
  const config = loadConfig();
  const commandLineUrls = parseCommandLineArgs();

  // Use command line URLs if provided, otherwise use URLs from config
  const urlsToScrape =
    commandLineUrls.length > 0 ? commandLineUrls : config.urlsToScrape;

  if (urlsToScrape.length === 0) {
    console.error(
      "No URLs provided. Please specify URLs in config.json or as command line arguments."
    );
    process.exit(1);
  }

  const database = new Database(
    MONGODB_USERNAME as string,
    MONGODB_PASSWORD as string,
    MONGODB_CLUSTER as string,
    config.dbName
  );

  const scraper = new WebScraper(database, urlsToScrape);

  try {
    await database.connect();
    await scraper.init();

    await scraper.scrapeAll(config.maxUrls);
  } catch (error) {
    console.error("An error occurred in main:", error);
  } finally {
    await scraper.close();
    await database.close();
  }
}
