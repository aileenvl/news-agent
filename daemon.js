const cron = require('node-cron');
const { runAllScrapers } = require('./schedule');

// Run every day at 5 AM local time
// This ensures posts are ready when you wake up
cron.schedule('0 5 * * *', () => {
    console.log('Starting daily scrape at:', new Date().toISOString());
    runAllScrapers();
});

console.log('Daemon started, scrapers will run daily at 5 AM');

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    process.exit(0);
});
