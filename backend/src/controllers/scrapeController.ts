import { Request, Response } from "express";
import { ScraperService } from "../services/scraperService";
import { DatabaseService } from "../services/databaseService";
import { ScrapedData } from "../models/ScrapedData";

// Wrap the handler function in another function to inject the DatabaseService
export const createScrapeHandler = (databaseService: DatabaseService) => {
  return async (req: Request, res: Response) => {
    const urlsToScrape: string[] = req.body.urls;
    const maxUrls: number = req.body.maxUrls || 50;

    if (!urlsToScrape || urlsToScrape.length === 0) {
      return res.status(400).json({ error: "No URLs provided." });
    }

    const scrapeService = new ScraperService();
    const scrapedUrls = new Set<string>();

    try {
      await scrapeService.init();
      const results: ScrapedData[] = [];
      const errors: { url: string; error: string }[] = [];
      const urlQueue = new Set(urlsToScrape);

      while (urlsToScrape.length > 0 && results.length < maxUrls) {
        const url = urlQueue.values().next().value;

        if (!url || typeof url !== "string" || !url.trim()) {
          // Skip invalid URL
          console.error(`Skipping invalid URL: ${url}`);
          urlQueue.delete(url as string); // Remove invalid URL from queue
          continue;
        }

        urlQueue.delete(url);

        if (!scrapedUrls.has(url)) {
          try {
            const data = await scrapeService.scrapePage(url);
            results.push(data); // TODO: batch write?
            await databaseService.storeData(data);

            // Add new internal links to the queue
            for (const link of data.links) {
              if (
                link.isInternal &&
                !urlQueue.has(link.href) &&
                !scrapedUrls.has(link.href)
              ) {
                urlsToScrape.push(link.href);
              }
            }
          } catch (error) {
            if (error instanceof Error) {
              errors.push({ url, error: error.message });
            } else {
              errors.push({ url, error: String(error) });
            }
          }
        }
      }

      return res
        .status(200)
        .json({ message: "Scraping completed.", results, errors });
    } catch (error) {
      console.error("An error in scrapeHandler:", error);
      return res
        .status(500)
        .json({ error: "An error occurred during the scraping process." });
    } finally {
      await scrapeService.close();
    }
  };
};
