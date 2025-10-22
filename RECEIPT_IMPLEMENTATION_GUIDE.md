# Payment Receipt System Implementation

## Overview
This implementation provides a comprehensive payment receipt system for the MyToDoo platform that automatically generates detailed receipts when tasks are completed. The system supports Australia, New Zealand, and Sri Lanka with proper tax calculations.

## Backend Implementation

### 1. Receipt Model (Already Exists)
- **Location**: `models/Receipt.js`
- **Features**:
  - Automatic receipt number generation (format: MT20251008-0001)
  - Tax calculations for AU (10% GST), NZ (15% GST), LK (18% VAT)
  - Separate receipts for poster (payment) and tasker (earnings)
  - Complete financial breakdown with service fees
  - MyToDoo branding with logo

### 2. Receipt Service
- **Location**: `services/receiptService.js`
- **Key Functions**:
  - `generateReceiptsForCompletedTask(taskId)` - Creates both payment and earnings receipts
  - `generateReceiptPDF(receiptId)` - Creates downloadable PDF receipt
  - `getUserReceipts(userId, receiptType)` - Retrieves user's receipts
  - `calculateTaxBreakdown(serviceFee, currency)` - Calculates country-specific taxes

### 3. Receipt Controller
- **Location**: `controllers/receiptController.js`
- **Endpoints**:
  - `GET /api/receipts` - Get user's receipts with pagination
  - `GET /api/receipts/task/:taskId` - Get receipts for specific task
  - `GET /api/receipts/:receiptId` - Get receipt details
  - `GET /api/receipts/:receiptId/download` - Download PDF receipt

### 4. Receipt Routes
- **Location**: `routes/receiptRoutes.js`
- All routes require authentication via `authMiddleware`

### 5. Task Controller Integration
- **Modified**: `controllers/taskController.js`
- Automatically generates receipts when task status changes to "completed"
- Non-blocking: Task completion doesn't fail if receipt generation fails

## API Endpoints

### Get Task Receipts (For Download Button)
```
GET /api/receipts/task/:taskId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskId": "674a1b2c3d4e5f6789012345",
    "receipts": [
      {
        "receiptId": "674a1b2c3d4e5f6789012346",
        "receiptNumber": "MT20251008-0001",
        "receiptType": "payment",
        "amount": 105.50,
        "currency": "AUD",
        "dateGenerated": "2025-10-08T10:30:00.000Z",
        "downloadCount": 0,
        "canDownload": true
      }
    ]
  }
}
```

### Download Receipt PDF
```
GET /api/receipts/:receiptId/download
Authorization: Bearer <token>
```

**Response:** PDF file download

### Get User's All Receipts
```
GET /api/receipts?receiptType=payment&page=1&limit=10
Authorization: Bearer <token>
```

## Receipt Details

### Tax Calculations by Country
- **Australia (AUD)**: 10% GST included in service fee
- **New Zealand (NZD)**: 15% GST included in service fee  
- **Sri Lanka (LKR)**: 18% VAT included in service fee
- **Other currencies**: No tax applied

### Receipt Types
1. **Payment Receipt** (for poster - person who paid):
   - Shows total amount paid (task amount + service fee)
   - Includes tax breakdown
   - Shows Stripe transaction details

2. **Earnings Receipt** (for tasker - person who did work):
   - Shows amount received (task amount - service fee)
   - Includes deducted service fee and tax details
   - Shows net earnings

### Receipt Content
Each PDF receipt includes:
- Unique receipt number (MT format)
- MyToDoo logo in top right corner
- Task details (title, category, location, completion date)
- Financial breakdown (amount, service fee, taxes, total)
- Payment method and transaction ID
- Platform information (MyToDoo branding)
- User information (poster/tasker details)

## Frontend Integration

### 1. Task Completion Page Updates

After a task is marked as "completed", add a download receipt button:

```jsx
// In your task completion component
const [receipts, setReceipts] = useState([]);
const [loading, setLoading] = useState(false);

// Fetch receipts when task is completed
useEffect(() => {
  if (task.status === 'completed') {
    fetchTaskReceipts();
  }
}, [task.status]);

const fetchTaskReceipts = async () => {
  try {
    setLoading(true);
    const response = await fetch(`/api/receipts/task/${task._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setReceipts(data.data.receipts);
    }
  } catch (error) {
    console.error('Error fetching receipts:', error);
  } finally {
    setLoading(false);
  }
};

const downloadReceipt = async (receiptId, receiptNumber) => {
  try {
    const response = await fetch(`/api/receipts/${receiptId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error downloading receipt:', error);
  }
};

// In your JSX
{task.status === 'completed' && receipts.length > 0 && (
  <div className="receipt-section">
    <h4>Download Receipt</h4>
    {receipts.map(receipt => (
      <button 
        key={receipt.receiptId}
        onClick={() => downloadReceipt(receipt.receiptId, receipt.receiptNumber)}
        className="download-receipt-btn"
      >
        📄 Download Receipt ({receipt.receiptType === 'payment' ? 'Payment' : 'Earnings'})
      </button>
    ))}
  </div>
)}
```

### 2. User Dashboard Receipt History

Create a receipts page in user dashboard:

```jsx
// ReceiptsPage.jsx
const ReceiptsPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'payment', 'earnings'
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const fetchReceipts = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filter !== 'all' && { receiptType: filter })
      });
      
      const response = await fetch(`/api/receipts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReceipts(data.data.receipts);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    }
  };

  // Receipt list component JSX...
};
```

### 3. UI Components to Add

1. **Download Receipt Button** - On completed task cards
2. **Receipt History Page** - In user dashboard menu
3. **Receipt Details Modal** - For viewing receipt details
4. **Loading States** - For PDF generation and download

### 4. Error Handling

```jsx
const handleDownloadError = (error) => {
  if (error.status === 403) {
    showMessage('Access denied to this receipt', 'error');
  } else if (error.status === 404) {
    showMessage('Receipt not found', 'error');
  } else {
    showMessage('Failed to download receipt. Please try again.', 'error');
  }
};
```

## Testing

### Run the Test Script
```bash
node test-receipt-system.js
```

This will test:
- Receipt generation for completed tasks
- PDF creation functionality
- User receipt retrieval
- Tax calculations

## Security & Access Control

### Receipt Access Rules
- **Poster**: Can only access their payment receipts
- **Tasker**: Can only access their earnings receipts
- **Authentication**: All routes require valid JWT token
- **Validation**: Receipt ownership verified on every request

### Data Privacy
- Receipts contain only necessary transaction information
- Personal data limited to names and email addresses
- No sensitive payment method details stored

## Important Notes

### Who Gets Which Receipt?
- **Poster (Task Creator)**: Gets "payment" receipt showing what they paid
- **Tasker (Service Provider)**: Gets "earnings" receipt showing what they earned
- Both receipts generated automatically when task marked "completed"

### Tax Handling
- Tax is **included** in the service fee, not added on top
- Tax rates are country-specific based on currency
- Tax breakdown shown separately in receipt for transparency

### Error Handling
- Receipt generation failure doesn't prevent task completion
- Failed receipts logged for manual review
- Users can regenerate receipts if needed

### Future Enhancements
- Email receipt delivery
- Receipt templates customization
- Bulk receipt downloads
- Integration with accounting software

## File Structure Created/Modified

```
backend/
├── services/receiptService.js          (NEW)
├── controllers/receiptController.js    (NEW)
├── routes/receiptRoutes.js            (NEW)
├── controllers/taskController.js       (MODIFIED - added receipt generation)
├── app.js                             (MODIFIED - added receipt routes)
└── test-receipt-system.js             (NEW)
```

The system is now fully functional and ready for frontend integration!