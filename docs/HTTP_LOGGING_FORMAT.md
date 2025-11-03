# HTTP Request Logging Format

## Before (Verbose Combined Format)

```
::1 - - [03/Nov/2025:11:24:06 +0000] "GET /api/categories/by-location?type=Online HTTP/1.1" 304 - "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36" {"service":"mytodo-backend"}
```

## After (Clean Custom Format)

```
GET /api/categories/by-location?type=Online 304 15.23 ms - guest
POST /api/tasks 201 234.56 ms - 507f1f77bcf86cd799439011
PUT /api/tasks/123 200 89.12 ms - 507f1f77bcf86cd799439011
```

## Format Breakdown

The new format shows only the essential information:

- **Method** - HTTP method (GET, POST, PUT, DELETE, etc.)
- **URL** - The endpoint being accessed (with query parameters)
- **Status** - HTTP status code (200, 201, 304, 404, 500, etc.)
- **Response Time** - How long the request took in milliseconds
- **User ID** - The authenticated user's ID, or "guest" if not authenticated

## Examples

**Successful GET request by guest:**

```
GET /api/categories 200 12.34 ms - guest
```

**Successful POST by authenticated user:**

```
POST /api/tasks 201 156.78 ms - 507f1f77bcf86cd799439011
```

**Not Modified (cached) response:**

```
GET /api/categories/by-location?type=Online 304 5.67 ms - guest
```

**Error response:**

```
POST /api/tasks 400 23.45 ms - 507f1f77bcf86cd799439011
```

## Benefits

1. **Readable** - Easy to understand at a glance
2. **Concise** - No unnecessary information like browser user-agent
3. **Useful** - Shows method, endpoint, performance, and user
4. **Clean Logs** - Much easier to scan through log files
5. **Performance Tracking** - Response time visible for every request

## Where This Appears

These HTTP logs appear in:

- Console output (if NODE_ENV=development)
- `logs/combined.log` file
- Both are automatically managed by Winston

## Log Levels

HTTP requests are logged at the `info` level by default. They appear alongside:

- Application info logs (task created, etc.)
- Warnings
- Errors

You can filter them in the log files if needed.
