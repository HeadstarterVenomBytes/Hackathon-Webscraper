export class UrlHelper {
  private static baseOrigin: string | null = null;

  static normalize(url: string): URL {
    return new URL(url);
  }

  static getBaseUrl(): string | null {
    return this.baseOrigin;
  }

  static setBaseUrl(baseUrl: string): void {
    const normalizedBaseUrl = this.normalize(baseUrl);
    this.baseOrigin = normalizedBaseUrl.origin;
  }

  static isInternal(url: string): boolean {
    if (this.baseOrigin === null) {
      throw new Error("Base URL origin is not set.");
    }
    const normalizedUrl = this.normalize(url);
    return normalizedUrl.origin === this.baseOrigin;
  }
}
