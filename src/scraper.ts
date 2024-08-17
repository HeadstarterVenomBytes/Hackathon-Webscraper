import puppeteer, { Browser, Page, HTTPResponse } from "puppeteer";
import { LinkData, ScrapedData, ImageData } from "./types";
import { Database } from "./database";

export class WebScraper {
  private browser: Browser | null = null;
  private database: Database;
  private urlsToScrape: Set<string> = new Set();
  private scrapedUrls: Set<string> = new Set();

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

  async scrapeAll(maxUrls: number = 100): Promise<void> {
    if (!this.browser) {
      throw new Error("WebScraper not initialized");
    }

    while (this.urlsToScrape.size > 0 && this.scrapedUrls.size < maxUrls) {
      const url = this.urlsToScrape.values().next().value;

      // Ensure that url is defined
      if (typeof url === "string") {
        this.urlsToScrape.delete(url);

        // Proceed only if the URL has not been scraped
        if (!this.scrapedUrls.has(url)) {
          await this.scrapePage(url);
          this.scrapedUrls.add(url);
        }
      }
    }
  }

  private async extractData(
    page: Page,
    url: string,
    response: HTTPResponse
  ): Promise<ScrapedData> {
    const [
      title,
      description,
      keywords,
      h1Headers,
      paragraphs,
      links,
      images,
      lastModified,
      contentLength,
    ] = await Promise.all([
      this.extractTitle(page),
      this.extractDescription(page),
      this.extractKeywords(page),
      this.extractH1Headers(page),
      this.extractParagraphs(page),
      this.extractLinks(page, url),
      this.extractImages(page),
      this.getLastModified(response),
      this.getContentLength(response),
    ]);

    return {
      url,
      title,
      description,
      keywords,
      h1Headers,
      paragraphs,
      links,
      images,
      lastModified,
      contentLength,
      statusCode: response.status(),
      timestamp: new Date(),
    };
  }

  private async extractTitle(page: Page): Promise<string> {
    return page.evaluate(() => document.title || "");
  }

  private async extractDescription(page: Page): Promise<string> {
    return page.evaluate(() => {
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      return metaDescription
        ? (metaDescription as HTMLMetaElement).content
        : "";
    });
  }

  private async extractKeywords(page: Page): Promise<string[]> {
    return page.evaluate(() => {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      return metaKeywords
        ? (metaKeywords as HTMLMetaElement).content
            .split(",")
            .map((keyword) => keyword.trim())
        : [];
    });
  }

  private async extractH1Headers(page: Page): Promise<string[]> {
    return page.evaluate(() => {
      const h1Elements = document.querySelectorAll("h1");
      return Array.from(h1Elements).map((el) => el.textContent?.trim() || "");
    });
  }

  private async extractParagraphs(page: Page): Promise<string[]> {
    return page.evaluate(() => {
      const paragraphs = document.querySelectorAll("p");
      return Array.from(paragraphs)
        .map((p) => p.textContent?.trim() || "")
        .filter((text) => text.length > 0);
    });
  }

  private async extractLinks(page: Page, baseUrl: string): Promise<LinkData[]> {
    return page.evaluate((baseUrl) => {
      const links = document.querySelectorAll("a");
      return Array.from(links).map((link) => ({
        href: link.href,
        text: link.textContent?.trim() || "",
        isInternal: link.href.startsWith(baseUrl),
      }));
    }, baseUrl);
  }

  private async extractImages(page: Page): Promise<ImageData[]> {
    return page.evaluate(() => {
      const images = document.querySelectorAll("img");
      return Array.from(images).map((img) => ({
        src: img.src,
        alt: img.alt,
        width: img.width || null,
        height: img.height || null,
      }));
    });
  }

  private async getLastModified(
    response: HTTPResponse
  ): Promise<string | null> {
    const headers = response.headers();
    return headers["last-modified"] || null;
  }

  private async getContentLength(
    response: HTTPResponse
  ): Promise<number | null> {
    const headers = response.headers();
    const contentLength = headers["content-length"];
    return contentLength ? parseInt(contentLength, 10) : null;
  }

  private async scrapePage(url: string): Promise<void> {
    if (!this.browser) {
      throw new Error("WebScraper not initialized");
    }

    let page: Page | null = null;

    try {
      page = await this.browser.newPage();
      page.setDefaultNavigationTimeout(30000);

      const response = await page.goto(url, { waitUntil: "networkidle0" });

      if (!response) {
        throw new Error("No response received from the page");
      }

      if (response.status() === 404) {
        console.log(`Page not found: ${url}`);
        return;
      }

      if (!response.ok()) {
        throw new Error(`HTTP error! status: ${response.status()}`);
      }

      await page.waitForSelector("body");

      const scrapedData = await this.extractData(page, url, response);
      await this.database.storeData(scrapedData);

      // Add new links to urlsToScrape
      scrapedData.links.forEach((link) => {
        if (
          !this.scrapedUrls.has(link.href) &&
          !this.urlsToScrape.has(link.href)
        ) {
          this.urlsToScrape.add(link.href);
        }
      });

      console.log(
        `Data from ${url} has been scraped and stored in the database.`
      );
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
    } finally {
      if (page) await page.close();
    }
  }
}
