import puppeteer, { Browser, Page } from "puppeteer";
import { ScrapedData } from "./types";
import { Database } from "./database";

export class WebScraper {
  private browser: Browser | null = null;
  private database: Database;
  private urlsToScrape: Set<string> = new Set();
  private scrapedtoUrls: Set<string> = new Set();

  constructor(database: Database, initialUrls: string[]) {
    this.database = database;
    initialUrls.forEach((url) => this.urlsToScrape.add(url));
  }

  async init(): Promise<void> {
    this.browser = await puppeteer.launch();
  }

  async close(): Promise<void> {
    if (this.browser) await this.browser.close();
  }
}
