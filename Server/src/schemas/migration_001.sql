-- Creating the database
CREATE DATABASE web_scraper;

-- Table to store scraped data
CREATE TABLE scraped_data (
    id SERIAL PRIMARY KEY,
    source_url TEXT NOT NULL,          -- URL of the scraped page
    title TEXT,                        -- Title of the scraped item
    price TEXT,                        -- Price of the scraped item
    description TEXT,                  -- Description of the scraped item
    results JSONB NOT NULL,            -- Full scraped results (as JSON)
    scraped_at TIMESTAMP DEFAULT NOW() -- Timestamp of when the data was scraped
    job_id TEXT NOT NULL UNIQUE,      -- Unique job ID (e.g., "job19")
);

-- Table to track scraping jobs
CREATE TABLE scraping_jobs (
    id SERIAL PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,       -- Unique job ID (e.g., "job19")
    source_url TEXT NOT NULL,          -- URL(s) being scraped (for bulk, this can be a JSON array)
    selectors JSONB NOT NULL,          -- Selectors used for scraping (stored as JSON)
    status TEXT NOT NULL DEFAULT 'pending', -- Status of the job: "pending", "completed", "failed"
    result JSONB,                      -- Result of the job (stored as JSON)
    created_at TIMESTAMP DEFAULT NOW(),-- Timestamp of when the job was created
    updated_at TIMESTAMP DEFAULT NOW() -- Timestamp of when the job was last updated
);

-- Table to store caching information track Redis cache in the postgresql
CREATE TABLE scraping_cache (
    id SERIAL PRIMARY KEY,
    source_url TEXT NOT NULL UNIQUE,   -- URL of the cached data
    data JSONB NOT NULL,               -- Cached data (stored as JSON)
    cached_at TIMESTAMP DEFAULT NOW(), -- Timestamp of when the data was cached
    expires_at TIMESTAMP               -- Timestamp of when the cache expires
);

-- indexes for better query performance
CREATE INDEX idx_scraped_data_job_id ON scraped_data(job_id);
CREATE INDEX idx_scraped_data_source_url ON scraped_data(source_url);
CREATE INDEX idx_scraped_data_scraped_at ON scraped_data(scraped_at);