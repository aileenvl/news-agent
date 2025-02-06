const puppeteer = require('puppeteer');
const { scrapeHuggingFace, scrapeArticleContent } = require('./huggingface-scrapper');
const { CloudManager } = require('@oramacloud/client');
const fetch = require('node-fetch');
require('dotenv').config();

const PRIVATE_API_KEY = process.env.ORAMA_API_KEY;
if (!PRIVATE_API_KEY) {
    throw new Error('ORAMA_API_KEY is not set in environment variables');
}

const manager = new CloudManager({ api_key: PRIVATE_API_KEY });
const indexManager = manager.index('lm7dogudvklgcy4cg09ztnxz');

// Static sources array for now
const sources = [
    {
        name: 'Hugging Face Blog',
        type: 'scrape',
        url: 'https://huggingface.co/blog',
        config: {
            scrape_type: 'huggingface_blog'
        }
    },
    {
        name: 'Hacker News',
        type: 'api',
        url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
        config: {
            base_url: 'https://hacker-news.firebaseio.com/v0/item',
            hn_base_url: 'https://news.ycombinator.com/item?id='
        }
    }
];

// Debug function to check database connection and tables
async function checkDatabase() {
    /* Commented out Supabase implementation
    console.log('Checking database connection...');
    
    const { data: sources, error } = await supabase
        .from('sources')
        .select('*');

    if (error) {
        console.error('Error fetching sources:', error);
        return null;
    }
    */
    
    console.log('Using static sources configuration');
    if (sources && sources.length > 0) {
        console.log('Sources found:', sources.length);
        sources.forEach(source => {
            console.log('\nSource details:');
            console.log('- Name:', source.name);
            console.log('- Type:', source.type);
            console.log('- URL:', source.url);
            console.log('- Config:', source.config);
        });
    } else {
        console.log('No sources found in configuration');
    }
    return sources;
}

// Fetch data from an API
async function fetchFromAPI(url) {
    console.log('Fetching from API:', url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Fetched ${data.length} items from API`);
        
        // For Hacker News, we need to fetch each story
        if (url.includes('hacker-news')) {
            console.log('Processing Hacker News items...');
            const storyIds = data.slice(0, 30); // Get top 30 stories
            const stories = [];
            
            for (const id of storyIds) {
                try {
                    console.log(`Fetching story ${id}...`);
                    const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                    if (!storyResponse.ok) {
                        throw new Error(`HTTP error! status: ${storyResponse.status}`);
                    }
                    const story = await storyResponse.json();
                    if (story && story.url) {
                        stories.push({
                            title: story.title,
                            url: story.url,
                            date: new Date(story.time * 1000).toISOString(),
                            source_url: `https://news.ycombinator.com/item?id=${story.id}`,
                            score: story.score,
                            comments: story.descendants,
                            content: `Score: ${story.score} | Comments: ${story.descendants || 0}\n\n${story.text || ''}`
                        });
                        console.log(`Added story: ${story.title}`);
                    }
                } catch (error) {
                    console.error(`Error fetching story ${id}:`, error);
                }
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log(`Successfully processed ${stories.length} Hacker News stories`);
            return stories;
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching from API:', error);
        throw error;
    }
}

// Fetch data from an RSS feed
async function fetchFromRSS(url) {
    console.log(`Fetching RSS feed from ${url}`);
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    return Array.from(xmlDoc.querySelectorAll('item')).map((item) => ({
        title: item.querySelector('title').textContent,
        url: item.querySelector('link').textContent,
    }));
}

// Scrape a website
async function scrapeGeneric(browser, url, selector) {
    console.log(`Scraping website ${url} with type generic`);
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.waitForSelector(selector, { timeout: 5000 });

        const links = await page.evaluate((sel) => {
            const elements = document.querySelectorAll(sel);
            return Array.from(elements).map(element => ({
                title: element.textContent.trim(),
                url: element.href
            }));
        }, selector);

        return links;
    } catch (error) {
        console.error('Error scraping website:', error);
        return [];
    } finally {
        await page.close();
    }
}

// Fetch data from all sources
async function fetchAllSources() {
    const sources = await checkDatabase();
    if (!sources) return;

    console.log('\nStarting to process', sources.length, 'sources...\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        for (const source of sources) {
            console.log(`\nProcessing source: ${source.name} (${source.type})`);
            try {
                let items = [];
                if (source.type === 'api') {  
                    items = await fetchFromAPI(source.url);
                    if (items && items.length > 0) {
                        console.log(`Fetched ${items.length} items from ${source.name}`);
                        // Process items in smaller batches
                        const batchSize = 5;
                        for (let i = 0; i < items.length; i += batchSize) {
                            await processBatch(browser, items, source.name, i, batchSize);
                        }
                    } else {
                        console.log(`No items fetched from ${source.name}`);
                    }
                } else if (source.type === 'rss') {
                    items = await fetchFromRSS(source.url);
                } else if (source.type === 'scrape') {
                    const scrapeType = source.config?.scrape_type || 'generic';
                    if (scrapeType === 'huggingface_blog') {
                        items = await scrapeHuggingFace(browser, source.url);
                    } else {
                        items = await scrapeGeneric(browser, source.url, source.config.selector);
                    }
                }
            } catch (error) {
                console.error(`Error processing source ${source.name}:`, error);
            }
        }
    } finally {
        await browser.close();
    }
    console.log('\nFinished processing all sources');
}

async function processBatch(browser, items, sourceName, startIndex, batchSize) {
    const batch = items.slice(startIndex, startIndex + batchSize);
    console.log(`\nProcessing batch of ${batch.length} items from ${sourceName} (${startIndex + 1}-${startIndex + batch.length})`);

    const processedItems = await Promise.all(batch.map(async (item) => {
        console.log(`Processing item: ${item.title}`);
        let content = '';

        try {
            if (item.hnUrl) {
                console.log(`Fetching HN discussion content from: ${item.hnUrl}`);
                content = await scrapeContent(item.hnUrl);
                console.log(`HN discussion content length: ${content.length}`);
            }

            if (!content && item.url) {
                console.log(`Fetching external content from: ${item.url}`);
                content = await scrapeContent(item.url);
                console.log(`External content length: ${content.length}`);
            }
        } catch (error) {
            console.error(`Error fetching content for ${item.title}:`, error.message);
        }

        return {
            ...item,
            content: content || ''
        };
    }));

    // Save the batch
    try {
        await saveItems(sourceName, processedItems);
        console.log(`Successfully saved batch ${Math.floor(startIndex / batchSize) + 1} (${processedItems.length} items) from ${sourceName}`);
    } catch (error) {
        console.error(`Error saving batch from ${sourceName}:`, error.message);
    }

    // Add a small delay between batches to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 1000));
}

async function fetchItems() {
    /* Commented out Supabase implementation
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching items:', error);
        return null;
    } else {
        console.log('Items:', data);
        return data;
    }
    */
    
    // For now, we'll just return null since we're focusing on inserting data
    // We'll implement the search functionality later
    return null;
}

async function scrapeContent(url, retryCount = 0) {
    console.log(`Scraping content from: ${url} (attempt ${retryCount + 1})`);
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set shorter timeout and enable JavaScript errors
        await page.setDefaultNavigationTimeout(15000);
        await page.setDefaultTimeout(15000);
        
        // Set user agent to avoid being blocked
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Block unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                request.abort();
            } else {
                request.continue();
            }
        });
        
        // Navigate with a shorter timeout
        let navigationSuccessful = false;
        try {
            await page.goto(url, { 
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });
            navigationSuccessful = true;
        } catch (error) {
            console.warn(`Navigation timeout for ${url}, attempting to extract content anyway`);
        }
        
        // Wait for body content to be available
        try {
            await page.waitForSelector('body', { timeout: 2000 });
        } catch (error) {
            console.warn('Timeout waiting for body element');
        }
        
        // Extract the main content
        const content = await page.evaluate(() => {
            // Try to find the main content container
            const selectors = [
                'article',
                'main',
                '.content',
                '#content',
                '.post-content',
                '.article-content',
                '.entry-content',
                // For HN discussions
                '.fatitem',
                '.comment-tree',
                // Common blog platforms
                '.post',
                '.blog-post',
                // GitHub specific
                '#readme',
                '.markdown-body',
                // Generic
                '[role="main"]',
                '[role="article"]'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element.innerText;
                }
            }
            
            // If no specific content container found, get the body text
            // but exclude common navigation and footer elements
            const body = document.body;
            const excludeSelectors = [
                'header',
                'footer',
                'nav',
                '#header',
                '#footer',
                '#nav',
                '.header',
                '.footer',
                '.nav',
                '.navigation',
                '.sidebar',
                '#sidebar'
            ];
            
            // Clone body to avoid modifying the actual page
            const clone = body.cloneNode(true);
            excludeSelectors.forEach(selector => {
                const elements = clone.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });
            
            return clone.innerText;
        });
        
        await browser.close();
        
        // If we got content, return it
        if (content && content.trim().length > 0) {
            return content;
        }
        
        // If navigation failed and we have retries left, try again
        if (!navigationSuccessful && retryCount < 2) {
            console.log(`Retrying ${url} (${retryCount + 1}/2)`);
            return await scrapeContent(url, retryCount + 1);
        }
        
        return '';
        
    } catch (error) {
        console.error(`Error scraping content from ${url}:`, error.message);
        
        // Close browser if it's open
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError.message);
            }
        }
        
        // Retry on certain errors if we haven't exceeded retry limit
        if (retryCount < 2 && (
            error.message.includes('timeout') ||
            error.message.includes('net::') ||
            error.message.includes('Navigation failed')
        )) {
            console.log(`Retrying ${url} (${retryCount + 1}/2)`);
            return await scrapeContent(url, retryCount + 1);
        }
        
        return '';
    }
}

async function saveItems(sourceName, items) {
    /* Commented out Supabase implementation
    const { data, error } = await supabase
        .from('items')
        .upsert(
            items.map(item => ({
                source: sourceName,
                title: item.title,
                url: item.url,
                content: item.content,
                date: item.date || new Date().toISOString()
            }))
        );

    if (error) {
        throw error;
    }
    return data;
    */

    // Prepare items for Orama
    const oramaItems = items.map((item, index) => ({
        id: `${sourceName}-${item.url}`, // Use URL as part of ID for stable updates
        source: sourceName,
        title: item.title,
        url: item.url,
        content: item.content,
        date: item.date || new Date().toISOString(),
        upvotes: item.upvotes || 0
    }));

    // Update items in Orama - this will create new items if they don't exist
    try {
        await indexManager.update(oramaItems);
        console.log(`Successfully updated ${oramaItems.length} items in Orama`);
        return oramaItems;
    } catch (error) {
        console.error('Error updating items in Orama:', error);
        throw error;
    }
}

module.exports = {
    fetchAllSources,
    fetchItems,
    scrapeGeneric,
    scrapeContent,
    saveItems
};