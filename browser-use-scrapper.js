const puppeteer = require('puppeteer');

async function scrapeArticleContent(browser, url) {
    const page = await browser.newPage();
    
    try {
        console.log(`Navigating to article: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

        // Try different selectors to find the content
        const selectors = ['#__next', '.article-content', 'article', '.markdown-body'];
        let content = '';

        for (const selector of selectors) {
            try {
                console.log(`Trying selector ${selector}...`);
                // Wait for element to be present
                await page.waitForSelector(selector, { timeout: 5000 }).catch(() => null);
                
                // Remove non-content elements using JavaScript evaluation
                content = await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (!el) return '';

                    // Clone to avoid modifying original
                    const clone = el.cloneNode(true);
                    
                    // Remove non-content elements
                    const toRemove = clone.querySelectorAll(
                        'nav, header, footer, .navigation, .sidebar, script, style, iframe, button, ' +
                        '.ad, .ads, .advertisement, .cookie-notice, .popup, .modal, #hub-sidebar, ' +
                        '.hub-header, .hub-footer'
                    );
                    toRemove.forEach(node => node.parentNode?.removeChild(node));
                    
                    // Get text content and clean it up
                    return clone.textContent
                        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
                        .replace(/\n+/g, '\n')  // Replace multiple newlines with single newline
                        .trim();
                }, selector);

                if (content && content.length > 0) {
                    console.log(`Found content length: ${content.length}`);
                    console.log(`Content preview: ${content.substring(0, 200)}`);
                    break;
                }
            } catch (err) {
                console.log(`Selector ${selector} not found, trying next...`);
            }
        }

        if (!content || content.length === 0) {
            console.log('No content selectors found, using body');
            try {
                // Wait for body content to be available
                await page.waitForSelector('body', { timeout: 5000 }).catch(() => null);
                
                content = await page.evaluate(() => {
                    const clone = document.body.cloneNode(true);
                    const toRemove = clone.querySelectorAll(
                        'nav, header, footer, .navigation, .sidebar, script, style, iframe, button, ' +
                        '.ad, .ads, .advertisement, .cookie-notice, .popup, .modal, #hub-sidebar, ' +
                        '.hub-header, .hub-footer'
                    );
                    toRemove.forEach(node => node.parentNode?.removeChild(node));
                    return clone.textContent
                        .replace(/\s+/g, ' ')
                        .replace(/\n+/g, '\n')
                        .trim();
                });
            } catch (e) {
                console.error(`Error extracting content after timeout: ${e.message}`);
                return '';
            }
        }

        return content;
        
    } catch (error) {
        if (error.name === 'TimeoutError') {
            console.log(`Navigation timeout for ${url}, attempting to extract content anyway`);
            try {
                await page.waitForSelector('body', { timeout: 5000 }).catch(() => null);
                const content = await page.evaluate(() => {
                    const clone = document.body.cloneNode(true);
                    const toRemove = clone.querySelectorAll(
                        'nav, header, footer, .navigation, .sidebar, script, style, iframe, button, ' +
                        '.ad, .ads, .advertisement, .cookie-notice, .popup, .modal, #hub-sidebar, ' +
                        '.hub-header, .hub-footer'
                    );
                    toRemove.forEach(node => node.parentNode?.removeChild(node));
                    return clone.textContent
                        .replace(/\s+/g, ' ')
                        .replace(/\n+/g, '\n')
                        .trim();
                });
                return content;
            } catch (e) {
                console.error(`Error extracting content after timeout: ${e.message}`);
                return '';
            }
        }
        console.error('Error fetching article content:', error);
        return '';
    } finally {
        await page.close();
    }
}

async function scrapeHackerNews(browser) {
    console.log('Starting to scrape HackerNews...');
    const page = await browser.newPage();
    
    try {
        await page.goto('https://news.ycombinator.com', { waitUntil: 'networkidle0', timeout: 30000 });
        await page.waitForSelector('.titleline > a', { timeout: 5000 });
        
        const posts = await page.evaluate(() => {
            const items = document.querySelectorAll('.athing');
            return Array.from(items).map(item => {
                const titleElement = item.querySelector('.titleline > a');
                const subtext = item.nextElementSibling;
                const score = subtext ? subtext.querySelector('.score') : null;
                const age = subtext ? subtext.querySelector('.age') : null;
                
                return {
                    title: titleElement ? titleElement.textContent : '',
                    url: titleElement ? titleElement.href : '',
                    upvotes: score ? parseInt(score.textContent) : 0,
                    date: age ? age.title : new Date().toISOString()
                };
            });
        });
        
        console.log(`Found ${posts.length} posts on HackerNews`);
        return posts;
        
    } catch (error) {
        console.error('Error scraping HackerNews:', error);
        return [];
    } finally {
        await page.close();
    }
}

module.exports = {
    scrapeArticleContent,
    scrapeHackerNews
};