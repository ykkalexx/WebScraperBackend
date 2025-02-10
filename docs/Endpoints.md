### Endpoints

#### POST : /api/scape/single

- **Input:**

```json
{
  "url": "url",
  "item": "item",
  "selectors": {
    "title": "span.item-title",
    "price": "li.price-current",
    "description": "div.item-info"
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
  "jobId": "single-123456789"
}
```

#### POST : /api/scape/bulk

- **Input:**

```json
{
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "item": "product",
  "selectors": {
    "title": "h1.product-title",
    "price": "span.price",
    "description": "div.product-description"
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
  "jobIds": ["bulk-123456789", "bulk-123456790"]
}
```

#### POST : /api/scrape/seo

```json
{
  "url": "https://example.com"
}
```

```json
{
  "title": "Example Page",
  "description": "This is an example page",
  "keywords": "example, test, page",
  "h1": ["Main Heading"],
  "h2": ["Sub Heading 1", "Sub Heading 2"],
  "images": [
    {
      "src": "https://example.com/image.jpg",
      "alt": "Example image"
    }
  ],
  "links": [
    {
      "href": "https://example.com/about",
      "text": "About Us"
    }
  ]
}
```

#### GET : /api/scrape/status?jobId=bulk-123456789

```json
{
  "status": "completed",
  "result": {
    "data": [
      {
        "title": "Product 1",
        "price": "$19.99",
        "description": "Great product"
      }
    ],
    "totalPages": 1,
    "success": true
  }
}
```

#### GET : /scraper/status

```json
{
  "jobs": [
    {
      "url": "https://example.com",
      "status": "completed",
      "lastRun": "2025-01-20"
    }
  ]
}
```
