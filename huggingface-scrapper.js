const puppeteer = require('puppeteer');

async function scrapeArticleContent(browser, url) {
    const page = await browser.newPage();
    
    try {
        console.log(`Navigating to article: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

        // Try different selectors to find the content
        const selectors = ['.prose', '.article-content', '.markdown-body', 'article', 'main'];
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
                    console.log(`Found content using ${selector}, length: ${content.length}`);
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

async function scrapeHuggingFace(browser, url) {
    const page = await browser.newPage();
    
    try {
        await page.goto(url, { waitUntil: 'networkidle0' });
        
        const blogPosts = await page.evaluate(() => {
            const posts = document.querySelectorAll('.grid.grid-cols-1.gap-12 > .SVELTE_HYDRATER');
            return Array.from(posts).map(post => {
                const props = JSON.parse(post.getAttribute('data-props'));
                const blog = props.blog;
                return {
                    title: blog.title,
                    url: `https://huggingface.co/blog/${blog.slug}`,
                    date: blog.publishedAt,
                    upvotes: blog.upvotes,
                    description: ''
                };
            });
        });
        
        // Process in batches of 5
        const batchSize = 5;
        for (let i = 0; i < blogPosts.length; i += batchSize) {
            console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}...\n`);
            const batch = blogPosts.slice(i, i + batchSize);
            
            // Log the batch details
            for (const post of batch) {
                console.log(`\nFetching content for: ${post.title}`);
                console.log(`URL: ${post.url}`);
            }
            
            // Fetch content for each post in parallel
            const contentPromises = batch.map(post => scrapeArticleContent(browser, post.url));
            const contents = await Promise.all(contentPromises);
            
            // Update posts with content
            for (let j = 0; j < batch.length; j++) {
                batch[j].content = contents[j] || '';
            }
        }
        
        console.log(`\nProcessed ${blogPosts.length} blog posts with content`);
        
        // Log first post for debugging
        console.log('\nFirst post:', JSON.stringify(blogPosts[0], null, 2));
        
        return blogPosts;
        
    } catch (error) {
        console.error('Error scraping Hugging Face blog:', error);
        return [];
    } finally {
        await page.close();
    }
}

module.exports = {
    scrapeHuggingFace,
    scrapeArticleContent
};