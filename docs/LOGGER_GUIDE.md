# Logger Implementation Guide

## Overview

Winston logger has been implemented throughout the application for structured, production-ready logging.

## Features

### 1. **Log Levels**

- `error`: Error events that might still allow the application to continue running
- `warn`: Warning messages for potentially harmful situations
- `info`: Informational messages highlighting progress of the application
- `debug`: Detailed information for debugging purposes

### 2. **Log Files**

All logs are stored in the `/logs` directory:

- `combined.log`: All logs (max 5MB, keeps 5 files)
- `error.log`: Only error-level logs (max 5MB, keeps 5 files)
- `exceptions.log`: Unhandled exceptions
- `rejections.log`: Unhandled promise rejections

### 3. **Console Output**

In development (NODE_ENV !== 'production'):

- Logs are displayed in the console with colors
- Timestamp and log level are included
- Metadata is shown as JSON

## Usage Examples

### Basic Logging

```javascript
const logger = require("./config/logger");

// Info level
logger.info("User logged in", { userId: user._id, email: user.email });

// Error level
logger.error("Payment failed", {
  error: error.message,
  stack: error.stack,
  userId: user._id,
});

// Warning level
logger.warn("API rate limit approaching", {
  userId: user._id,
  requestCount: 95,
});

// Debug level (only in development)
logger.debug("Cache hit", { key: cacheKey, ttl: 3600 });
```

### In Try-Catch Blocks

```javascript
try {
  await someOperation();
  logger.info("Operation completed successfully", { operationId: id });
} catch (error) {
  logger.error("Operation failed", {
    error: error.message,
    stack: error.stack,
    operationId: id,
  });
  throw error;
}
```

### HTTP Request Logging

The logger is automatically integrated with Morgan middleware to log all HTTP requests.

### Socket.io Events

```javascript
io.on("connection", (socket) => {
  logger.info("Client connected", { socketId: socket.id });

  socket.on("disconnect", () => {
    logger.info("Client disconnected", { socketId: socket.id });
  });
});
```

## Configuration

### Environment Variables

```env
# Set log level (default: info)
LOG_LEVEL=debug  # Options: error, warn, info, debug

# Set environment
NODE_ENV=development  # or production
```

### Production vs Development

**Development:**

- Logs to console with colors
- Logs to files
- Log level: debug

**Production:**

- No console logging (only files)
- Log level: info
- Structured JSON format for log aggregation tools

## Best Practices

### 1. **Include Context**

Always include relevant context in your logs:

```javascript
// ❌ Bad
logger.error("Failed");

// ✅ Good
logger.error("Payment processing failed", {
  error: error.message,
  userId: user._id,
  paymentId: payment.id,
  amount: payment.amount,
});
```

### 2. **Use Appropriate Log Levels**

- `error`: Database connection failed, payment processing failed
- `warn`: API rate limit approaching, deprecated feature used
- `info`: User login, task created, payment successful
- `debug`: Cache operations, detailed flow information

### 3. **Don't Log Sensitive Data**

```javascript
// ❌ Bad - logging passwords and tokens
logger.info("User login", {
  email: user.email,
  password: user.password,
  token: jwtToken,
});

// ✅ Good
logger.info("User login", {
  userId: user._id,
  email: user.email,
});
```

### 4. **Structure Your Metadata**

```javascript
logger.info("Task created", {
  taskId: task._id,
  userId: user._id,
  category: task.category,
  budget: task.budget,
  timestamp: new Date(),
});
```

## Integration with Services

### Example: Task Service

```javascript
const logger = require("../../config/logger");

class TaskService {
  async createTask(taskData, userId) {
    try {
      logger.info("Creating new task", { userId, category: taskData.category });

      const task = await taskRepository.create(taskData);

      logger.info("Task created successfully", {
        taskId: task._id,
        userId,
      });

      return task;
    } catch (error) {
      logger.error("Task creation failed", {
        error: error.message,
        stack: error.stack,
        userId,
        taskData: { category: taskData.category, budget: taskData.budget },
      });
      throw error;
    }
  }
}
```

## Monitoring Logs

### View Logs in Real-time

```bash
# Watch all logs
tail -f logs/combined.log

# Watch only errors
tail -f logs/error.log

# Search for specific user
grep "userId.*123456" logs/combined.log
```

### Log Rotation

Logs are automatically rotated when they reach 5MB. The system keeps the last 5 files.

## Production Recommendations

1. **Use Log Aggregation Service**

   - Integrate with services like Datadog, Loggly, or ELK Stack
   - Stream logs using Winston transports

2. **Set Up Alerts**

   - Alert on error rate spikes
   - Monitor critical operations

3. **Regular Log Cleanup**

   - Archive old logs
   - Set up automated cleanup scripts

4. **Performance**
   - Avoid logging in tight loops
   - Use async logging for high-traffic endpoints

## Example: Complete Service with Logger

```javascript
const logger = require("../../config/logger");
const notificationRepository = require("../../repository/notification");

class NotificationService {
  async sendNotification(userId, notificationData) {
    logger.debug("Sending notification", {
      userId,
      type: notificationData.type,
    });

    try {
      const notification = await notificationRepository.create({
        recipient: userId,
        ...notificationData,
      });

      logger.info("Notification sent successfully", {
        notificationId: notification._id,
        userId,
        type: notification.type,
      });

      return notification;
    } catch (error) {
      logger.error("Notification send failed", {
        error: error.message,
        stack: error.stack,
        userId,
        type: notificationData.type,
      });
      throw error;
    }
  }
}
```

## Troubleshooting

### Logs Not Appearing

1. Check LOG_LEVEL environment variable
2. Verify logs directory exists and is writable
3. Check file permissions on logs directory

### Too Many Logs

1. Increase log level to 'warn' or 'error' in production
2. Review debug statements in code
3. Implement log sampling for high-frequency events

### Performance Issues

1. Move to async transport for production
2. Reduce metadata size
3. Use log sampling for high-traffic endpoints
