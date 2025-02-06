const { scrapeHuggingFace } = require('./huggingface-scrapper');
const { scrapeHackerNews } = require('./browser-use-scrapper');
const { supabase } = require('./supabase');

// Map of source names to their scraper functions
const SCRAPERS = {
    'huggingface_blog': scrapeHuggingFace,
    'hacker_news': scrapeHackerNews,
    // Add new scrapers here as they're created
};

// Function to get active sources from the database
async function getActiveSources() {
    const { data: sources, error } = await supabase
        .from('sources')
        .select('*')
        .eq('type', 'scrape');

    if (error) {
        console.error('Error fetching sources:', error);
        return [];
    }
    return sources;
}

// Function to insert posts into the database
async function insertPosts(posts, sourceId) {
    console.log(`Inserting ${posts.length} posts for source ${sourceId}`);
    
    for (const post of posts) {
        const { error } = await supabase
            .from('items')
            .upsert({
                title: post.title,
                url: post.url,
                published_at: post.date,
                description: post.description,
                content: post.content,
                upvotes: post.upvotes,
                source_id: sourceId,
                ai_processed: false // Mark as not processed by AI yet
            }, {
                onConflict: 'url' // This ensures we don't insert duplicates
            });
        
        if (error) {
            console.error(`Error inserting post for ${sourceId}:`, error);
        }
    }
}

// Function to get unprocessed items for AI summarization
async function getUnprocessedItems() {
    const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .eq('ai_processed', false)
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error fetching unprocessed items:', error);
        return [];
    }
    return items;
}

// Function to update item with AI summary
async function updateItemWithSummary(itemId, summary) {
    const { error } = await supabase
        .from('items')
        .update({
            summary: summary,
            ai_processed: true
        })
        .eq('id', itemId);

    if (error) {
        console.error('Error updating item with summary:', error);
    }
}

// Function to run all scrapers
async function runAllScrapers() {
    try {
        console.log('Starting scheduled scrape at:', new Date().toISOString());
        
        // Get all active sources
        const sources = await getActiveSources();
        console.log(`Found ${sources.length} active sources to scrape`);

        // Run each scraper
        for (const source of sources) {
            const scraper = SCRAPERS[source.name];
            if (scraper) {
                try {
                    console.log(`Running scraper for ${source.name}`);
                    const posts = await scraper();
                    console.log(`Found ${posts.length} posts for ${source.name}`);
                    await insertPosts(posts, source.id);
                } catch (error) {
                    console.error(`Error running scraper for ${source.name}:`, error);
                    // Continue with other scrapers even if one fails
                }
            } else {
                console.log(`No scraper found for source: ${source.name}`);
            }
        }
        
        console.log('Finished running all scrapers');
    } catch (error) {
        console.error('Error in scheduled scrape:', error);
    }
}

// For testing the script directly
if (require.main === module) {
    runAllScrapers().then(() => process.exit(0));
}

// Export for use in other files
module.exports = {
    runAllScrapers,
    getUnprocessedItems,
    updateItemWithSummary
};
