import { Request, Response } from "express";
import { ScraperService } from "../services/scraperService";
import { DatabaseService } from "../services/databaseService";
import { ScrapedData } from "../models/ScrapedData";

export const scrapeHandler = async (req: Request, res: Response) => {
  const urlsToScrape: string[] = req.body.urls;
  const maxUrls: number = req.body.maxUrls || 50;

  if (!urlsToScrape || urlsToScrape.length === 0) {
    return res.status(400).json({ error: "No URLs provided." });
  }

  const databaseService = new DatabaseService();
  const scrapeService = new ScraperService();

  try {
    await databaseService.connect();
    await scrapeService.init();

    const results: ScrapedData[] = [];
    const errors: { url: string; error: string }[] = [];

    while (urlsToScrape.length > 0 && results.length < maxUrls) {
      const url = urlsToScrape.shift(); // Get the next URL to scrape
      if (url) {
        try {
          const data = await scrapeService.scrapePage(url);
          results.push(data); // TODO: batch write?
          await databaseService.storeData(data);

          // Add new internal links to the queue
          for (const link of data.links) {
            if (link.isInternal && !urlsToScrape.includes(link.href)) {
              urlsToScrape.push(link.href);
            }
          }
        } catch (error) {
          errors.push({ url, error: error.message });
        }
      }
    }

    res.status(200).json({ message: "Scraping completed.", results, errors });
  } catch (error) {
    console.error("An error in scrapeHandler:", error);
    res
      .status(500)
      .json({ error: "An error occurred during the scraping process." });
  } finally {
    await scrapeService.close();
    await databaseService.close();
  }
};
