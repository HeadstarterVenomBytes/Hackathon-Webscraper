import puppeteer, { Browser, Page, HTTPResponse } from "puppeteer";
import { LinkData, ScrapedData, ImageData } from "../models/ScrapedData";

export class ScraperService {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    this.browser = await puppeteer.launch();
  }

  async close(): Promise<void> {
    if (this.browser) await this.browser.close();
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
      this.extractTitle(page).catch(() => ""),
      this.extractDescription(page),
      this.extractKeywords(page),
      this.extractH1Headers(page).catch(() => []),
      this.extractParagraphs(page).catch(() => []),
      this.extractLinks(page, url).catch(() => []),
      this.extractImages(page).catch(() => []),
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
    return page.$eval("title", (el) => el.textContent || "");
  }

  private async extractDescription(page: Page): Promise<string> {
    return page
      .$eval(
        'meta[name="description"]',
        (el: HTMLMetaElement) => el.content || ""
      )
      .catch(() => "");
  }

  private async extractKeywords(page: Page): Promise<string[]> {
    return page
      .$eval('meta[name="keywords"]', (el: HTMLMetaElement) =>
        el.content.split(",").map((keyword) => keyword.trim())
      )
      .catch(() => []);
  }

  private async extractH1Headers(page: Page): Promise<string[]> {
    return page.$$eval("h1", (elements) =>
      elements.map((el) => el.textContent?.trim() || "")
    );
  }

  private async extractParagraphs(page: Page): Promise<string[]> {
    return page.$$eval("p", (elements) =>
      elements
        .map((el) => el.textContent?.trim() || "")
        .filter((text) => text.length > 0)
    );
  }

  private async extractLinks(page: Page, baseUrl: string): Promise<LinkData[]> {
    return page.$$eval(
      "a",
      (elements, baseUrl) => {
        const baseHostname = new URL(baseUrl).hostname;
        const baseDomain = baseHostname.split(".").slice(-2).join("."); // Get base domain without subdomain

        return elements.map((link) => {
          let linkUrl;
          try {
            linkUrl = new URL(link.href);
          } catch {
            // If href is invalid, consider it internal
            return {
              href: link.href,
              text: link.textContent?.trim() || "",
              isInternal: true,
            };
          }

          const linkDomain = linkUrl.hostname.split(".").slice(-2).join(".");

          return {
            href: link.href,
            text: link.textContent?.trim() || "",
            isInternal: linkDomain === baseDomain, // Compare base domains
          };
        });
      },
      baseUrl
    );
  }

  private async extractImages(page: Page): Promise<ImageData[]> {
    return page.$$eval("img", (elements) =>
      elements.map((img) => ({
        src: img.src,
        alt: img.alt,
        width: img.width || null,
        height: img.height || null,
      }))
    );
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

  async scrapePage(url: string): Promise<ScrapedData> {
    if (!this.browser) {
      throw new Error("WebScraper not initialized");
    }

    let page: Page | null = null;

    try {
      page = await this.browser.newPage();
      page.setDefaultNavigationTimeout(30000);

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      // Disable caching
      await page.setCacheEnabled(false);

      // Set headers to avoid 304
      await page.setExtraHTTPHeaders({
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      });

      const response = await page.goto(url, {
        waitUntil: "networkidle0",
        // Force reload
        referer: "",
      });

      if (!response) {
        throw new Error("No response received from the page");
      }

      if (response.status() === 404) {
        console.log(`Page not found: ${url}`);
        throw new Error(`404 - Page not found`);
      }

      if (!response.ok()) {
        throw new Error(`HTTP error! status: ${response.status()}`);
      }

      await page.waitForSelector("body");

      const scrapedData = await this.extractData(page, url, response);

      return scrapedData;
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      throw error; // Rethrow to let the handler decide what to do
    } finally {
      if (page) await page.close();
    }
  }
}
