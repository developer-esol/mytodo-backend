# Swagger Configuration for Live Server

## Live Server URL

- **Swagger UI**: http://134.199.172.167:5001/api-docs/
- **Swagger JSON**: http://134.199.172.167:5001/api-docs/swagger.json

## Configuration Changes

### 1. Multiple Server Support

Swagger now supports multiple servers:

- **Production**: `http://134.199.172.167:5001/api` (HTTP - no SSL)
- **Local**: `http://localhost:5001/api`

You can switch between servers in the Swagger UI dropdown.

### 2. Environment Detection

The swagger automatically detects the environment:

- When `NODE_ENV=production`, it defaults to the production server
- When `NODE_ENV=development` or not set, it defaults to localhost

### 3. JSON Endpoint

The Swagger spec is available as JSON at:

- http://134.199.172.167:5001/api-docs/swagger.json (Production)
- http://localhost:5001/api-docs/swagger.json (Local)

## Testing on Live Server

1. **Access Swagger UI**:

   ```
   http://134.199.172.167:5001/api-docs/
   ```

2. **Select Server**:

   - In Swagger UI, look for the "Servers" dropdown at the top
   - Select "Production Server (HTTP)"

3. **Test Endpoints**:
   - Click "Try it out" on any endpoint
   - Fill in required parameters
   - Click "Execute"
   - API calls will be made to `http://134.199.172.167:5001/api/*`

## CORS Configuration

Make sure your server allows CORS from Swagger UI. If you encounter CORS errors, update `app.js`:

```javascript
app.use(
  cors({
    origin: "*", // or specific origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);
```

## Security Note

⚠️ **HTTP (No SSL)**:

- This configuration uses HTTP without SSL encryption
- For production, consider:
  1. Setting up SSL/TLS certificate
  2. Changing URLs to `https://134.199.172.167:5001/api`
  3. Using a domain name instead of IP
  4. Setting up reverse proxy (nginx) with SSL

## Environment Variables

Set this on your live server for production:

```bash
NODE_ENV=production
```

This will:

- Default to production server in Swagger
- Log production URL
- Optimize for production environment

## Troubleshooting

### Swagger UI not loading:

1. Check if server is running: `http://134.199.172.167:5001/`
2. Check logs for errors
3. Verify port 5001 is accessible from outside

### API calls failing:

1. Check server selection in Swagger UI dropdown
2. Verify CORS configuration
3. Check if authentication is required
4. Look at browser console for errors

### Wrong server URL:

1. Make sure you selected the correct server from dropdown
2. Clear browser cache
3. Restart the server

## Server Selection in Swagger UI

When you open Swagger UI, you'll see a dropdown at the top:

```
Servers
▼ Production Server (HTTP)
  http://134.199.172.167:5001/api

  Local Server
  http://localhost:5001/api
```

Select the appropriate server before testing endpoints.
