# 🔊 Sound Notification Integration Guide

## Overview

The MyToDoo backend now supports **real-time notifications with sound alerts** using Socket.io. This guide shows you how to integrate sound notifications in your frontend application.

## 🚀 Backend Features Added

### 1. Socket.io Real-time Communication
- ✅ Real-time notification broadcasting
- ✅ User-specific notification rooms
- ✅ Sound preference management
- ✅ Automatic sound triggering based on notification priority and type

### 2. Smart Sound Logic
Sound alerts are played automatically for:
- **High/Urgent Priority**: All notifications with HIGH or URGENT priority
- **Important Types**: OFFER_MADE, OFFER_ACCEPTED, PAYMENT_RECEIVED, MESSAGE_RECEIVED, TASK_ASSIGNED, TASK_COMPLETED

### 3. New API Endpoints
- `POST /api/notifications/test-sound` - Test sound notifications
- Socket.io events for real-time communication

## 📱 Frontend Integration

### Step 1: Install Socket.io Client

```bash
npm install socket.io-client
```

### Step 2: Connect to Notifications

```javascript
import { io } from 'socket.io-client';

// Initialize socket connection
const socket = io('http://localhost:5001', {
  transports: ['websocket', 'polling']
});

// Connect and join user's notification room
socket.on('connect', () => {
  console.log('Connected to notification server');
  
  // Join user's notification room
  socket.emit('join-user-room', currentUser.id);
  
  // Send sound preference
  socket.emit('update-sound-preference', {
    userId: currentUser.id,
    soundEnabled: userPreferences.soundEnabled // from user settings
  });
});
```

### Step 3: Handle Incoming Notifications

```javascript
// Listen for real-time notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  
  // Display notification in UI
  showNotificationInUI(notification);
  
  // Play sound if required
  if (notification.playSound && userPreferences.soundEnabled) {
    playNotificationSound(notification.type);
  }
  
  // Update unread count
  updateNotificationBadge();
});
```

### Step 4: Implement Sound System

```javascript
// Create audio elements for different notification sounds
const notificationSounds = {
  default: new Audio('/sounds/notification.mp3'),
  offer: new Audio('/sounds/offer.mp3'),
  message: new Audio('/sounds/message.mp3'),
  urgent: new Audio('/sounds/urgent.mp3')
};

function playNotificationSound(notificationType) {
  try {
    let sound;
    
    // Choose sound based on notification type
    switch (notificationType) {
      case 'OFFER_MADE':
      case 'OFFER_ACCEPTED':
        sound = notificationSounds.offer;
        break;
      case 'MESSAGE_RECEIVED':
        sound = notificationSounds.message;
        break;
      case 'URGENT_UPDATE':
        sound = notificationSounds.urgent;
        break;
      default:
        sound = notificationSounds.default;
    }
    
    // Reset and play
    sound.currentTime = 0;
    sound.play().catch(error => {
      console.log('Could not play sound:', error);
      // Fallback to vibration on mobile
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    });
  } catch (error) {
    console.error('Sound play error:', error);
  }
}
```

### Step 5: User Sound Preferences

```javascript
// Sound preference toggle
function toggleNotificationSounds(enabled) {
  userPreferences.soundEnabled = enabled;
  
  // Save to localStorage or user settings
  localStorage.setItem('notificationSounds', enabled);
  
  // Update server
  if (socket.connected) {
    socket.emit('update-sound-preference', {
      userId: currentUser.id,
      soundEnabled: enabled
    });
  }
}

// Load sound preference on app start
const savedSoundPreference = localStorage.getItem('notificationSounds');
userPreferences.soundEnabled = savedSoundPreference !== 'false'; // default true
```

## 🎵 Sound Files

Add these sound files to your `public/sounds/` directory:

1. **notification.mp3** - Default notification sound
2. **offer.mp3** - For offer-related notifications  
3. **message.mp3** - For new messages
4. **urgent.mp3** - For urgent/high priority alerts

### Sound Requirements:
- **Format**: MP3 or WAV
- **Duration**: 1-3 seconds
- **Volume**: Moderate (not too loud)
- **File Size**: < 50KB each

## 🔧 React/Vue Component Example

### React Component

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function NotificationSystem({ userId }) {
  const [socket, setSocket] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Initialize socket
    const newSocket = io('http://localhost:5001');
    
    newSocket.on('connect', () => {
      newSocket.emit('join-user-room', userId);
      newSocket.emit('update-sound-preference', {
        userId,
        soundEnabled
      });
    });

    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
      
      if (notification.playSound && soundEnabled) {
        playNotificationSound(notification.type);
      }
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [userId]);

  const toggleSounds = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    
    if (socket) {
      socket.emit('update-sound-preference', {
        userId,
        soundEnabled: newSoundEnabled
      });
    }
  };

  return (
    <div className="notification-system">
      <div className="sound-toggle">
        <label>
          <input 
            type="checkbox" 
            checked={soundEnabled}
            onChange={toggleSounds}
          />
          Enable notification sounds
        </label>
      </div>
      
      <div className="notifications-list">
        {notifications.map(notif => (
          <div key={notif.id} className="notification-item">
            <h4>{notif.title}</h4>
            <p>{notif.message}</p>
            {notif.playSound && <span>🔊</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🧪 Testing

### 1. Test Notification Page
Open `http://localhost:5001/test-notifications.html` to test the system

### 2. API Testing
```javascript
// Test sound notification
fetch('/api/notifications/test-sound', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'OFFER_MADE',
    title: 'Test Sound Alert',
    message: 'Testing notification sounds!',
    priority: 'HIGH'
  })
});
```

## 📋 Notification Types That Trigger Sound

| Notification Type | Sound Trigger | Priority |
|------------------|---------------|----------|
| OFFER_MADE | ✅ Yes | HIGH |
| OFFER_ACCEPTED | ✅ Yes | HIGH |
| PAYMENT_RECEIVED | ✅ Yes | HIGH |
| MESSAGE_RECEIVED | ✅ Yes | NORMAL |
| TASK_ASSIGNED | ✅ Yes | HIGH |
| TASK_COMPLETED | ✅ Yes | HIGH |
| TASK_POSTED | ❌ No | NORMAL |
| SYSTEM_UPDATE | ❌ No | NORMAL |
| Any HIGH/URGENT | ✅ Yes | HIGH/URGENT |

## 🛠️ Browser Compatibility

- ✅ **Chrome 66+**: Full support
- ✅ **Firefox 58+**: Full support  
- ✅ **Safari 11+**: Full support
- ✅ **Edge 79+**: Full support

## 🎯 Best Practices

1. **User Control**: Always provide sound toggle option
2. **Respect Permissions**: Request audio permission when needed
3. **Fallback Options**: Use vibration on mobile if sound fails
4. **Volume Control**: Keep sounds moderate and brief
5. **Sound Quality**: Use clear, pleasant notification tones
6. **Performance**: Preload audio files for instant playback

## 🚨 Production Considerations

1. **Sound File Hosting**: Host sound files on CDN for better performance
2. **User Preferences**: Store sound preferences in user profile
3. **Background Notifications**: Handle notifications when app is minimized
4. **Rate Limiting**: Prevent sound spam with rate limiting
5. **Accessibility**: Provide visual alternatives for hearing-impaired users

## 🎉 Summary

Your MyToDoo notification system now includes:

✅ **Real-time Socket.io integration**  
✅ **Smart sound alerts based on priority and type**  
✅ **User-controllable sound preferences**  
✅ **Test endpoints and demo page**  
✅ **Frontend integration examples**  
✅ **Cross-browser compatibility**  

The system is ready for production use and will significantly improve user engagement with timely audio alerts for important notifications!