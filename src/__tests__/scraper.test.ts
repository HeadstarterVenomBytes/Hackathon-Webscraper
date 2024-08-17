import { WebScraper } from "../scraper";
import { Database } from "../database";
import puppeteer, { Browser, Page, HTTPResponse } from "puppeteer";

// Mock puppeteer and Database
jest.mock("puppeteer");
jest.mock("../database");

describe("WebScraper", () => {
  let scraper: WebScraper;
  let mockDatabase: jest.Mocked<Database>;
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<Page>;

  beforeEach(() => {
    mockDatabase = new Database("", "", "", "") as jest.Mocked<Database>;
    mockBrowser = {
      newPage: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<Browser>;
    mockPage = {
      goto: jest.fn(),
      setDefaultNavigationTimeout: jest.fn(),
      waitForSelector: jest.fn(),
      evaluate: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<Page>;

    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
    mockBrowser.newPage.mockResolvedValue(mockPage);

    scraper = new WebScraper(mockDatabase, ["https://example.com"]);
  });

  test("init should launch a browser", async () => {
    await scraper.init();
    expect(puppeteer.launch).toHaveBeenCalled();
  });

  test("close should close the browser", async () => {
    await scraper.init();
    await scraper.close();
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  test("scrapeAll should scrape pages until maxUrls is reached", async () => {
    const mockResponse = {
      status: jest.fn().mockReturnValue(200),
      ok: jest.fn().mockReturnValue(true),
      headers: jest.fn().mockReturnValue({}),
    } as unknown as HTTPResponse;

    mockPage.goto.mockResolvedValue(mockResponse);
    mockPage.evaluate.mockImplementation(() => {
      return Promise.resolve([]);
    });

    await scraper.init();
    await scraper.scrapeAll(2);

    // Expect newPage to be called twice (for two URLs)
    expect(mockBrowser.newPage).toHaveBeenCalledTimes(2);
    // Expect storeData to be called twice (for two scraped pages)
    expect(mockDatabase.storeData).toHaveBeenCalledTimes(2);
  });
});
