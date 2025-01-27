# Web Scraper Architecture Documentation

## Overview

The Web Scraper is a Node.js application built with TypeScript that provides a robust API for scraping website data. It utilizes Playwright for web scraping, PostgreSQL for data storage, and Redis for caching and job queuing.

## Key Features

- Single and bulk website scraping
- SEO analysis
- Job status tracking
- Caching mechanism
- Rate limiting
- Error handling

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Web Framework**: Express.js
- **Web Scraping**: Playwright
- **Database**: PostgreSQL
- **Caching/Queue**: Redis
- **Job Queue**: BullMQ

## Architecture Diagram

[Client] -> [API Gateway] -> [Scraper Service] -> [Database]
| |
v v
[Redis Queue] [Redis Cache]

## Components

### 1. API Layer

- **Routes**: Defined in `src/routes/index.ts`
  - POST `/api/scrape/single`
  - POST `/api/scrape/bulk`
  - GET `/api/scraper/status`
  - POST `/api/scrape/seo`
  - GET `/api/data`
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Error Handling**: Global error middleware

### 2. Service Layer

- **PlaywrightService**: Handles web scraping logic
  - Single page scraping
  - Bulk scraping with caching
  - SEO analysis
  - Job status tracking
- **QueueService**: Manages background jobs using BullMQ

### 3. Data Layer

- **PostgreSQL**: Stores scraped data and job status
  - `scraped_data` table
  - `scraping_jobs` table
  - `scraping_cache` table
- **Redis**: Used for caching and job queue

### 4. Infrastructure

- **Docker**: Containerized environment
- **Environment Variables**: Configuration management
- **Logging**: Winston for structured logging

## Data Flow

1. Client sends request to API
2. API validates request and creates job
3. Job is added to Redis queue
4. Worker processes job using Playwright
5. Results are stored in PostgreSQL
6. Cache is updated in Redis
7. Client can query job status and results

## Security

- Rate limiting to prevent abuse
- Environment variables for sensitive data
