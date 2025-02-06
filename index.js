// index.js
const { program } = require('commander');
const { fetchAllSources } = require('./fetchData');
require('dotenv').config();

// Set up CLI commands
program
    .command('run')
    .description('Run fetching and scraping on-demand')
    .action(async () => {
        try {
            console.log('Running fetch and scrape on-demand...');
            await fetchAllSources().catch(error => {
                console.error('Error in fetchAllSources:', error);
                throw error;
            });
            console.log('Fetch and scrape completed.');
        } catch (error) {
            console.error('Failed to complete fetch and scrape:', error);
            process.exit(1);
        }
    });

program
    .command('scheduler')
    .description('Start the scheduler for daily fetching and scraping')
    .action(() => {
        require('./scheduler');
    });

program.parse(process.argv);