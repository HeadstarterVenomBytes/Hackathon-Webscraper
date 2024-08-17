export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  keywords: string[];
  h1Headers: string[];
  paragraphs: string[];
  links: LinkData[];
  images: ImageData[];
  lastModified: string | null;
  contentLength: number | null;
  statusCode: number;
  timestamp: Date;
}

export interface LinkData {
  href: string;
  text: string;
  isInternal: boolean;
}

export interface ImageData {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
}
