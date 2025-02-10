# Web Scraper API

A robust Node.js application built with TypeScript that provides an API for scraping website data. It utilizes Playwright for web scraping, PostgreSQL for data storage, and Redis for caching and job queuing.

## Features

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

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Redis
- Playwright

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ykkalexx/WebScraperBackend.git
   cd web-scraper
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the database:

   ```bash
   psql -U user -d web_scraper -f src/schemas/migration_001.sql
   ```

4. Start Redis:

   ```bash
   sudo systemctl enable redis-server
   sudo systemctl start redis-server
   ```

5. Create a `.env` file in the `Server` directory with the following content:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=user
   DB_PASSWORD=password
   DB_NAME=web_scraper
   REDIS_HOST=localhost
   REDIS_PORT=6379
   PORT=3000
   ```

6. Start the server:
   ```bash
   npm run dev
   ```

## API Documentation

The API documentation is available at `http://localhost:3000/api-docs`.

### Endpoints

#### POST `/api/scrape/single`

Scrape a single website.

#### POST `/api/scrape/bulk`

Scrape multiple websites.

#### GET `/api/scrape/status`

Get the status of a scraping job.

#### POST `/api/scrape/seo`

Analyze the SEO of a website.

#### GET `/api/data`

Get scraped results by URL.

For detailed request and response schemas, refer to the API documentation.

## Architecture

### Components

1. **API Layer**

   - Routes: Defined in `src/routes/index.ts`
   - Rate Limiting: 100 requests per 15 minutes per IP
   - Error Handling: Global error middleware

2. **Service Layer**

   - `PlaywrightService`: Handles web scraping logic
   - `QueueService`: Manages background jobs using BullMQ

3. **Data Layer**
   - PostgreSQL: Stores scraped data and job status
   - Redis: Used for caching and job queue

### Data Flow

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

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Acknowledgments

- [Playwright](https://playwright.dev/) for web scraping
- [PostgreSQL](https://www.postgresql.org/) for data storage
- [Redis](https://redis.io/) for caching and job queuing
- [BullMQ](https://docs.bullmq.io/) for job queue management
