import { Page } from "puppeteer";
import { LinkData } from "../models/ScrapedData";

export class LinkExtractor {
  private normalizedBaseUrl: string | null = null;

  constructor(private baseUrl: string) {
    this.updateNormalizedBaseUrl(baseUrl);
  }

  private updateNormalizedBaseUrl(baseUrl: string) {
    this.normalizedBaseUrl = this.normalizeUrl(baseUrl);
  }

  private normalizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  private isInternalUrl(url: string): boolean {
    if (!this.normalizedBaseUrl) return false;
    const linkUrl = this.normalizeUrl(url);
    return (
      linkUrl === this.normalizedBaseUrl ||
      linkUrl.endsWith(`.${this.normalizedBaseUrl}`)
    );
  }

  public async extractLinks(page: Page): Promise<LinkData[]> {
    return page.evaluate((isInternalUrl) => {
      const links = document.querySelectorAll("a");
      return Array.from(links).map((link) => ({
        href: link.href,
        text: link.textContent?.trim() || "",
        isInternal: this.isInternalUrl(link.href),
      }));
    }, this.isInternalUrl.bind(this));
  }
}
