import puppeteer from 'puppeteer';

export default async function launch() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    return browser;
}
