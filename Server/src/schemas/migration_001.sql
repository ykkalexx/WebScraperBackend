-- Creating the database
CREATE DATABASE web_scraper;

CREATE TABLE scraped_data (
    id SERIAL PRIMARY KEY,
    source_url TEXT NOT NULL,
    title TEXT,
    price TEXT,
    description TEXT,
    scraped_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scraping_jobs (
    id SERIAL PRIMARY KEY,
    source_url TEXT NOT NULL,
    selectors JSONB NOT NULL,
    schedule INTERVAL,
    last_run TIMESTAMP DEFAULT NULL
);
