const mongoose = require("mongoose");

const ReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    // Poster (person who paid)
    poster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Tasker (person who did the work)
    tasker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Receipt type: 'payment' for poster, 'earnings' for tasker
    receiptType: {
      type: String,
      enum: ["payment", "earnings"],
      required: true,
    },
    // Financial details
    financial: {
      // Original offer/task amount
      offerAmount: {
        type: Number,
        required: true,
      },
      // Service fee charged/deducted
      serviceFee: {
        type: Number,
        required: true,
      },
      // Total amount paid by poster (offer + service fee for payment receipts)
      totalPaid: {
        type: Number,
        required: true,
      },
      // Amount received by tasker (offer - service fee for earnings receipts)
      amountReceived: {
        type: Number,
        required: true,
      },
      // Currency
      currency: {
        type: String,
        required: true,
      },
      // Tax information (for Australia, New Zealand, Sri Lanka)
      tax: {
        // GST for Australia/New Zealand, VAT for Sri Lanka
        taxType: {
          type: String,
          enum: ["GST", "VAT", "None"],
          default: "None",
        },
        taxRate: {
          type: Number,
          default: 0, // Percentage (e.g., 10 for 10%)
        },
        taxAmount: {
          type: Number,
          default: 0,
        },
        // Tax is typically included in service fee for marketplace platforms
        taxIncludedInServiceFee: {
          type: Boolean,
          default: true,
        },
      },
      // Stripe payment details
      stripe: {
        paymentIntentId: String,
        chargeId: String,
        transactionFee: Number, // Stripe's transaction fee
      },
    },
    // Task details snapshot (for receipt generation)
    taskDetails: {
      title: String,
      category: String,
      location: String,
      dateCompleted: Date,
      description: String,
    },
    // Company/Platform information
    platformInfo: {
      name: {
        type: String,
        default: "MyToDoo",
      },
      address: {
        type: String,
        default: "Australia | New Zealand | Sri Lanka",
      },
      abn: {
        type: String,
        default: "ABN: 123 456 789", // Australian Business Number
      },
      email: {
        type: String,
        default: "support@mytodoo.com",
      },
      phone: {
        type: String,
        default: "+61 2 1234 5678",
      },
    },
    // Receipt status
    status: {
      type: String,
      enum: ["generated", "sent", "downloaded"],
      default: "generated",
    },
    // Generation metadata
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloadedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate receipt number before saving
ReceiptSchema.pre("save", async function (next) {
  if (!this.receiptNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      // Find the last receipt number for today
      const lastReceipt = await this.constructor
        .findOne({
          receiptNumber: new RegExp(`^MT${year}${month}${day}`),
        })
        .sort({ receiptNumber: -1 });

      let sequence = 1;
      if (lastReceipt) {
        const lastSequence = parseInt(lastReceipt.receiptNumber.slice(-4));
        sequence = lastSequence + 1;
      }

      // Format: MT20251008-0001 (MyToDoo + YYYYMMDD + sequence)
      this.receiptNumber = `MT${year}${month}${day}-${String(sequence).padStart(
        4,
        "0"
      )}`;
    } catch (error) {
      console.error("Error generating receipt number:", error);
      // Fallback to timestamp-based number
      this.receiptNumber = `MT${Date.now()}`;
    }
  }
  next();
});

// Indexes for better performance
ReceiptSchema.index({ receiptNumber: 1 }, { unique: true });
ReceiptSchema.index({ task: 1 });
ReceiptSchema.index({ poster: 1 });
ReceiptSchema.index({ tasker: 1 });
ReceiptSchema.index({ receiptType: 1 });
ReceiptSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Receipt", ReceiptSchema);
