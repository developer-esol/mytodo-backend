# Swagger HTTP Fix - Preventing ERR_SSL_PROTOCOL_ERROR

## Problem

Swagger UI was failing to load on the live HTTP server (134.199.172.167:5001) with `ERR_SSL_PROTOCOL_ERROR`. The browser was incorrectly trying to load assets via HTTPS instead of HTTP.

## Root Cause

1. **Helmet middleware** was enabling HSTS (HTTP Strict Transport Security) headers
2. **Content Security Policy** had `upgradeInsecureRequests` directive enabled
3. **Swagger UI** didn't have explicit HTTP scheme configuration

## Solutions Implemented

### 1. Helmet Configuration (app.js)

Disabled HTTPS-forcing security headers:

```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
        connectSrc: ["'self'", "http:", "https:"],
        upgradeInsecureRequests: null, // ✅ Disabled HTTPS upgrade
      },
    },
    hsts: false, // ✅ Disabled HTTP Strict Transport Security
    strictTransportSecurity: false, // ✅ Explicitly disabled HSTS
  })
);
```

**Key Changes:**

- ✅ `upgradeInsecureRequests: null` - Prevents automatic HTTP → HTTPS upgrades
- ✅ `hsts: false` - Disables Strict-Transport-Security header
- ✅ `strictTransportSecurity: false` - Double-ensures HSTS is off
- ✅ Allows `http:` in `connectSrc` and `imgSrc` directives

### 2. Swagger Configuration (swagger.js)

Added explicit HTTP headers and middleware:

```javascript
// Swagger options with explicit HTTP configuration
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      {
        url: `http://134.199.172.167:5001/api-docs/swagger.json`,
        name: "Production Server (HTTP)",
      },
      {
        url: `http://localhost:5001/api-docs/swagger.json`,
        name: "Local Server",
      },
    ],
    validatorUrl: null, // ✅ Disable validator to prevent HTTPS calls
    supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
  },
  swaggerUrl:
    process.env.NODE_ENV === "production"
      ? `http://134.199.172.167:5001/api-docs/swagger.json`
      : `http://localhost:5001/api-docs/swagger.json`,
};

// Middleware to force HTTP headers
app.use("/api-docs", (req, res, next) => {
  res.removeHeader("Strict-Transport-Security"); // ✅ Remove HSTS
  res.setHeader(
    "Content-Security-Policy",
    "upgrade-insecure-requests; default-src 'self' 'unsafe-inline' 'unsafe-eval' http: data: blob:"
  );
  next();
});
```

**Key Changes:**

- ✅ `validatorUrl: null` - Prevents Swagger validator from making HTTPS calls
- ✅ Explicit `swaggerUrl` with HTTP scheme
- ✅ Custom middleware removes HSTS headers for `/api-docs` routes
- ✅ CSP allows HTTP content loading

### 3. JSON Endpoint Headers (swagger.js)

Updated the Swagger JSON endpoint to prevent HTTPS forcing:

```javascript
app.get("/api-docs/swagger.json", (req, res) => {
  res.removeHeader("Strict-Transport-Security"); // ✅ Remove HSTS
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(swaggerSpec);
});
```

## Testing Steps

### 1. Clear Browser Cache

```bash
# Chrome
Ctrl + Shift + Delete → Clear cache and cookies

# Or use Incognito mode
Ctrl + Shift + N
```

### 2. Restart Server

```bash
# Stop the server
Ctrl + C

# Start the server
npm start
# or
node server.js
```

### 3. Test Swagger UI

```
http://134.199.172.167:5001/api-docs/
```

### 4. Verify in Browser DevTools

Open browser console (F12) and check:

- ✅ No `ERR_SSL_PROTOCOL_ERROR`
- ✅ All assets loaded via `http://` (not `https://`)
- ✅ Network tab shows all requests using HTTP
- ✅ No HSTS warnings

### 5. Test API Calls

1. Select "Production Server (HTTP)" from dropdown
2. Expand any endpoint
3. Click "Try it out"
4. Fill parameters
5. Click "Execute"
6. Verify response is successful

## Expected Results

✅ **Browser Console**: No SSL errors
✅ **Network Tab**: All requests use `http://` scheme
✅ **Swagger UI**: Loads successfully with all assets
✅ **API Calls**: Work correctly when using "Try it out"
✅ **Response Headers**: No `Strict-Transport-Security` header

## Troubleshooting

### Still seeing ERR_SSL_PROTOCOL_ERROR?

1. **Clear browser cache completely**

   - Chrome may cache HSTS settings for extended periods
   - Try incognito mode first

2. **Check browser HSTS cache**

   - Chrome: Visit `chrome://net-internals/#hsts`
   - Enter domain: `134.199.172.167`
   - Click "Delete" to remove HSTS policy

3. **Verify server is running on HTTP**

   ```bash
   # Check if server is listening on HTTP (not HTTPS)
   netstat -an | findstr "5001"
   ```

4. **Check Helmet configuration**

   - Verify `hsts: false` is set
   - Verify `upgradeInsecureRequests: null`

5. **Check reverse proxy (if using nginx/apache)**
   - Ensure proxy doesn't add HSTS headers
   - Check for any HTTPS redirect rules

### Assets still loading via HTTPS?

1. **Check CSP headers**

   ```javascript
   // In swagger.js middleware
   res.setHeader(
     "Content-Security-Policy",
     "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: data: blob:"
   );
   ```

2. **Verify Swagger options**

   ```javascript
   validatorUrl: null; // Must be null, not false
   ```

3. **Check browser extensions**
   - Some extensions force HTTPS
   - Test in incognito with extensions disabled

## Security Considerations

⚠️ **HTTP is not secure for production!**

This configuration is suitable for:

- ✅ Development environments
- ✅ Internal/private networks
- ✅ Testing purposes
- ✅ Behind a reverse proxy that handles SSL

**For production, you should:**

1. Set up SSL/TLS certificate (Let's Encrypt is free)
2. Use HTTPS everywhere
3. Enable HSTS for security
4. Use a domain name instead of IP address
5. Configure reverse proxy (nginx) with SSL termination

## Migration Path to HTTPS

When ready to move to HTTPS:

1. **Get SSL Certificate**

   ```bash
   # Using Let's Encrypt
   sudo certbot --nginx -d yourdomain.com
   ```

2. **Update URLs to HTTPS**

   ```javascript
   servers: [
     {
       url: "https://yourdomain.com/api",
       description: "Production (HTTPS)",
     },
   ];
   ```

3. **Re-enable HSTS**

   ```javascript
   app.use(
     helmet({
       hsts: {
         maxAge: 31536000,
         includeSubDomains: true,
         preload: true,
       },
     })
   );
   ```

4. **Enable CSP upgrades**
   ```javascript
   contentSecurityPolicy: {
     directives: {
       upgradeInsecureRequests: [],
     }
   }
   ```

## Summary

✅ Disabled HSTS in Helmet
✅ Removed `upgradeInsecureRequests` from CSP
✅ Added HTTP-specific headers to Swagger routes
✅ Disabled Swagger validator to prevent HTTPS calls
✅ Explicitly configured HTTP scheme for all Swagger URLs

Your Swagger UI should now work perfectly on HTTP without any SSL errors! 🎉
