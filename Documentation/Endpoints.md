### Endpoints

#### POST : /scape/single

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
  "data": [
    {
      "title": "title",
      "price": "price",
      "description": "Item Description"
    }
  ],
  "totalPages": 1,
  "success": true
}
```

#### GET : /data?source=example.com

```json
{
  "source": "example.com",
  "data": [
    { "title": "Product 1", "price": "$10", "description": "Great product" }
  ]
}
```

#### GET : /scrape-status

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
