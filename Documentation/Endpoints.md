### Endpoints

#### POST : /scape

- **Input:**

```json
{
  "url": "https://example.com",
  "selectors": {
    "title": ".title",
    "price": ".price",
    "description": ".desc"
  }
}
```

- **Output:**

```json
{
  "status": "success",
  "data": [
    { "title": "Product 1", "price": "$10", "description": "Great product" }
  ]
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
