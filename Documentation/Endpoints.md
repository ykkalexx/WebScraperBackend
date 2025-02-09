### Endpoints

#### POST : /api/scrape/single

- **Input:**

```json
{
  "url": "https://www.newegg.com/p/pl?d=iphone",
  "searchTerms": {
    "title": "iPhone"
  },
  "options": {
    "maxPages": 3,
    "waitTime": 2000,
    "retryAttempts": 3,
    "concurrent": false,
    "nextPageSelector": "a.pagination-next",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
  }
}
```

- **Output:**

```json
{
  "message": "Scraping job queued",
  "jobId": "21"
}
```

#### POST : /api/scrape/bulk

- **Input:**

```json
{
  "urls": [
    "https://www.newegg.com/p/pl?d=iphone",
    "https://www.newegg.com/p/pl?d=iphone&page=2"
  ],
  "searchTerms": {
    "title": "iPhone"
  },
  "options": {
    "maxPages": 1,
    "waitTime": 1000,
    "retryAttempts": 2
  }
}
```

- **Output:**

```json
{
  "message": "Bulk scraping jobs queued",
  "jobIds": ["1", "2"]
}
```

#### POST : /api/data

- **Input:**

```json
{
  "url": "https://www.newegg.com/p/pl?d=iphone"
}
```

- **Output:**

```json
{
  "result": {
    "rows": [
      {
        "id": 1,
        "source_url": "https://www.newegg.com/p/pl?d=iphone",
        "title": "iPhone 14 Pro Max",
        "price": "$999.99",
        "description": "Latest iPhone model with advanced features",
        "results": [
          {
            "title": "iPhone 14 Pro Max",
            "price": "$999.99",
            "description": "Latest iPhone model with advanced features"
          }
        ],
        "scraped_at": "2025-02-09T11:23:49.663Z"
      }
    ]
  }
}
```

#### GET : /api/scrape/status?jobId=123456789

- **Output:**

```json
{
  "status": "completed",
  "result": {
    "data": [
      {
        "title": "iPhone 14 Pro Max",
        "price": "$999.99",
        "description": "Latest iPhone model with advanced features"
      }
    ],
    "totalPages": 1,
    "success": true
  }
}
```

#### POST : /api/scrape/seo

- **Input:**

```json
{
  "url": "https://www.newegg.com/p/pl?d=iphone"
}
```

- **Output:**

```json
{
  "title": "iPhone Search Results",
  "description": "Shop iPhone products at Newegg",
  "keywords": "iphone, apple, smartphone",
  "h1": ["iPhone Products"],
  "h2": ["Featured Items", "Best Sellers"],
  "images": [
    {
      "src": "https://example.com/iphone.jpg",
      "alt": "iPhone 14 Pro"
    }
  ],
  "links": [
    {
      "href": "https://www.newegg.com/p/123",
      "text": "iPhone 14 Pro Max"
    }
  ]
}
```
