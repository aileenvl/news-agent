// commands/run.js
const { fetchAllSources } = require('../fetchData');

(async () => {
    console.log('Running fetch and scrape on-demand...');
    await fetchAllSources();
    console.log('Fetch and scrape completed.');
})();