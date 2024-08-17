import puppeteer from "puppeteer";

async function scrapeWebsite(url: string): Promise<void> {
    try {
        const browser = await puppeteer.launch();

        const page = await browser.newPage();

        await page.goto(url);

        await page.waitForSelector('body');

        const paragraphs = await page.evaluate(() => {
            const elements = document.querySelectorAll('p');
            return Array.from(elements).map(element => element.textContent);
        });

        console.log('Scraped paragraphs:', paragraphs);

        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

const url = "https://www.olostep.com/"
scrapeWebsite(url)