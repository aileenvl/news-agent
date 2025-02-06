const supabase = require('./supabase');

async function addHackerNewsSource() {
    console.log('Adding Hacker News source to database...');
    
    const { data, error } = await supabase
        .from('sources')
        .insert([
            {
                name: 'Hacker News',
                url: 'https://news.ycombinator.com',
                type: 'scrape',
                config: {
                    scrape_type: 'hackernews',
                    selector: '.titleline > a'
                }
            }
        ]);

    if (error) {
        console.error('Error adding Hacker News source:', error);
    } else {
        console.log('Successfully added Hacker News source to database');
    }
}

// Run the function
addHackerNewsSource()
    .catch(console.error);
