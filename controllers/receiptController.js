// controllers/receiptController.js
const { generateReceiptPDF, getUserReceipts } = require('../services/receiptService');
const Receipt = require('../models/Receipt');

/**
 * Get user's receipts
 */
const getMyReceipts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { receiptType, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {
      $or: [
        { poster: userId },
        { tasker: userId }
      ]
    };
    
    if (receiptType && ['payment', 'earnings'].includes(receiptType)) {
      query.receiptType = receiptType;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const [receipts, total] = await Promise.all([
      Receipt.find(query)
        .populate('task', 'title categories completedAt status')
        .populate('poster', 'firstName lastName')
        .populate('tasker', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Receipt.countDocuments(query)
    ]);
    
    // Transform receipts for response
    const transformedReceipts = receipts.map(receipt => ({
      receiptId: receipt._id,
      receiptNumber: receipt.receiptNumber,
      receiptType: receipt.receiptType,
      taskTitle: receipt.task?.title || receipt.taskDetails?.title,
      taskCategory: receipt.task?.categories?.[0] || receipt.taskDetails?.category,
      amount: receipt.receiptType === 'payment' 
        ? receipt.financial.totalPaid 
        : receipt.financial.amountReceived,
      currency: receipt.financial.currency,
      serviceFee: receipt.financial.serviceFee,
      taxAmount: receipt.financial.tax.taxAmount,
      taxType: receipt.financial.tax.taxType,
      dateGenerated: receipt.generatedAt,
      dateCompleted: receipt.task?.completedAt || receipt.taskDetails?.dateCompleted,
      downloadCount: receipt.downloadCount,
      lastDownloaded: receipt.lastDownloadedAt,
      status: receipt.status,
      isMyPayment: receipt.poster.toString() === userId.toString(),
      isMyEarning: receipt.tasker.toString() === userId.toString()
    }));
    
    res.json({
      success: true,
      data: {
        receipts: transformedReceipts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipts',
      message: error.message
    });
  }
};

/**
 * Get specific receipt details
 */
const getReceiptById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { receiptId } = req.params;
    
    const receipt = await Receipt.findById(receiptId)
      .populate('task', 'title categories location details completedAt status')
      .populate('poster', 'firstName lastName email')
      .populate('tasker', 'firstName lastName email')
      .populate('offer', 'offer.amount offer.message')
      .populate('payment', 'paymentIntentId amount serviceFee currency status');
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }
    
    // Check if user has access to this receipt
    const hasAccess = receipt.poster._id.toString() === userId.toString() || 
                      receipt.tasker._id.toString() === userId.toString();
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Build detailed receipt response
    const receiptDetails = {
      receiptId: receipt._id,
      receiptNumber: receipt.receiptNumber,
      receiptType: receipt.receiptType,
      
      // Task information
      task: {
        id: receipt.task._id,
        title: receipt.task.title || receipt.taskDetails.title,
        category: receipt.task.categories?.[0] || receipt.taskDetails.category,
        location: receipt.task.location?.address || receipt.taskDetails.location,
        description: receipt.task.details || receipt.taskDetails.description,
        dateCompleted: receipt.task.completedAt || receipt.taskDetails.dateCompleted,
        status: receipt.task.status
      },
      
      // Financial details
      financial: {
        offerAmount: receipt.financial.offerAmount,
        serviceFee: receipt.financial.serviceFee,
        totalPaid: receipt.financial.totalPaid,
        amountReceived: receipt.financial.amountReceived,
        currency: receipt.financial.currency,
        
        // Tax breakdown
        tax: {
          type: receipt.financial.tax.taxType,
          rate: receipt.financial.tax.taxRate,
          amount: receipt.financial.tax.taxAmount,
          includedInServiceFee: receipt.financial.tax.taxIncludedInServiceFee
        },
        
        // Payment processing
        stripe: {
          paymentIntentId: receipt.financial.stripe.paymentIntentId,
          transactionFee: receipt.financial.stripe.transactionFee || 0
        }
      },
      
      // People involved
      people: {
        poster: {
          id: receipt.poster._id,
          name: `${receipt.poster.firstName} ${receipt.poster.lastName}`,
          email: receipt.poster.email
        },
        tasker: {
          id: receipt.tasker._id,
          name: `${receipt.tasker.firstName} ${receipt.tasker.lastName}`,
          email: receipt.tasker.email
        }
      },
      
      // Platform info
      platform: receipt.platformInfo,
      
      // Receipt metadata
      metadata: {
        dateGenerated: receipt.generatedAt,
        downloadCount: receipt.downloadCount,
        lastDownloaded: receipt.lastDownloadedAt,
        status: receipt.status
      },
      
      // User's relation to this receipt
      userRelation: {
        isMyPayment: receipt.poster._id.toString() === userId.toString(),
        isMyEarning: receipt.tasker._id.toString() === userId.toString()
      }
    };
    
    res.json({
      success: true,
      data: receiptDetails
    });
    
  } catch (error) {
    console.error('Error fetching receipt details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt details',
      message: error.message
    });
  }
};

/**
 * Download receipt as PDF
 */
const downloadReceiptPDF = async (req, res) => {
  try {
    const userId = req.user._id;
    const { receiptId } = req.params;
    
    // Verify receipt exists and user has access
    const receipt = await Receipt.findById(receiptId);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }
    
    // Check access
    const hasAccess = receipt.poster.toString() === userId.toString() || 
                      receipt.tasker.toString() === userId.toString();
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Generate PDF
    const pdfDoc = await generateReceiptPDF(receiptId);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`);
    
    // Pipe PDF to response
    pdfDoc.pipe(res);
    pdfDoc.end();
    
  } catch (error) {
    console.error('Error downloading receipt PDF:', error);
    
    // If headers haven't been sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate receipt PDF',
        message: error.message
      });
    }
  }
};

/**
 * Get receipt for a specific task (for the download button on task completion)
 */
const getTaskReceipts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;
    
    console.log(`📄 Receipt request - User: ${userId}, Task: ${taskId}`);
    
    // Find receipts for this task where user is involved
    const receipts = await Receipt.find({
      task: taskId,
      $or: [
        { poster: userId },
        { tasker: userId }
      ]
    })
    .populate('task', 'title status completedAt')
    .sort({ createdAt: -1 });
    
    console.log(`📄 Found ${receipts.length} receipts for task ${taskId}`);
    
    // If no receipts found, check if task is completed and try to generate them
    if (!receipts || receipts.length === 0) {
      const Task = require('../models/Task');
      const Payment = require('../models/Payment');
      const { generateReceiptsForCompletedTask } = require('../services/receiptService');
      
      console.log(`🔍 No receipts found, checking task status...`);
      
      // Check if task exists and is completed
      const task = await Task.findById(taskId);
      if (!task) {
        console.log(`❌ Task ${taskId} not found`);
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }
      
      console.log(`📋 Task status: ${task.status}, CreatedBy: ${task.createdBy}, AssignedTo: ${task.assignedTo}`);
      
      // Check if user has access to this task
      const hasAccess = task.createdBy.toString() === userId.toString() || 
                        task.assignedTo?.toString() === userId.toString();
      
      if (!hasAccess) {
        console.log(`🚫 User ${userId} has no access to task ${taskId}`);
        return res.status(403).json({
          success: false,
          error: 'Access denied to this task'
        });
      }
      
      // If task is completed, try to generate receipts
      if (task.status === 'completed') {
        console.log(`🔄 Task is completed, attempting to generate receipts...`);
        
        // Check if there's a completed payment
        const completedPayment = await Payment.findOne({ 
          task: taskId, 
          status: 'completed' 
        });
        
        if (!completedPayment) {
          console.log(`💳 No completed payment found for task ${taskId}`);
          return res.status(200).json({
            success: true,
            data: {
              taskId: taskId,
              receipts: []
            },
            message: 'No receipts available - payment not yet processed'
          });
        }
        
        // Check if receipts already exist to prevent duplicates
        const existingReceipts = await Receipt.find({ task: taskId });
        if (existingReceipts.length > 0) {
          console.log(`🔍 Found ${existingReceipts.length} existing receipts for task ${taskId}, skipping generation`);
          
          // Filter receipts user has access to
          const userReceipts = existingReceipts.filter(receipt => 
            receipt.poster.toString() === userId.toString() || 
            receipt.tasker.toString() === userId.toString()
          );
          
          if (userReceipts.length > 0) {
            const transformedReceipts = userReceipts.map(receipt => ({
              receiptId: receipt._id,
              receiptNumber: receipt.receiptNumber,
              receiptType: receipt.receiptType,
              amount: receipt.receiptType === 'payment' 
                ? receipt.financial.totalPaid 
                : receipt.financial.amountReceived,
              currency: receipt.financial.currency,
              dateGenerated: receipt.generatedAt,
              downloadCount: receipt.downloadCount,
              canDownload: true
            }));
            
            return res.json({
              success: true,
              data: {
                taskId: taskId,
                receipts: transformedReceipts
              }
            });
          }
        }
        
        try {
          console.log(`🔨 Generating receipts for completed task ${taskId}...`);
          const generatedReceipts = await generateReceiptsForCompletedTask(taskId);
          
          console.log(`✅ Generated receipts: Payment(${generatedReceipts.paymentReceipt.receiptNumber}), Earnings(${generatedReceipts.earningsReceipt.receiptNumber})`);
          
          // Fetch the newly generated receipts
          const newReceipts = await Receipt.find({
            task: taskId,
            $or: [
              { poster: userId },
              { tasker: userId }
            ]
          })
          .populate('task', 'title status completedAt')
          .sort({ createdAt: -1 });
          
          if (newReceipts.length > 0) {
            // Filter new receipts based on user's role (same logic as existing receipts)
            const userRelevantNewReceipts = [];
            
            // Check if user is poster (paid for the task)
            const newPaymentReceipts = newReceipts.filter(r => r.receiptType === 'payment' && r.poster.toString() === userId.toString());
            if (newPaymentReceipts.length > 0) {
              userRelevantNewReceipts.push(newPaymentReceipts[0]); // Take the first one
              console.log(`📄 Added new payment receipt for poster: ${newPaymentReceipts[0].receiptNumber}`);
            }
            
            // Check if user is tasker (did the work)
            const newEarningsReceipts = newReceipts.filter(r => r.receiptType === 'earnings' && r.tasker.toString() === userId.toString());
            if (newEarningsReceipts.length > 0) {
              userRelevantNewReceipts.push(newEarningsReceipts[0]); // Take the first one
              console.log(`📄 Added new earnings receipt for tasker: ${newEarningsReceipts[0].receiptNumber}`);
            }
            
            const transformedReceipts = userRelevantNewReceipts.map(receipt => ({
              receiptId: receipt._id,
              receiptNumber: receipt.receiptNumber,
              receiptType: receipt.receiptType,
              amount: receipt.receiptType === 'payment' 
                ? receipt.financial.totalPaid 
                : receipt.financial.amountReceived,
              currency: receipt.financial.currency,
              dateGenerated: receipt.generatedAt,
              downloadCount: receipt.downloadCount,
              canDownload: true,
              status: 'generated' // Ensure receipts are marked as ready for download
            }));
            
            console.log(`📤 Returning ${transformedReceipts.length} filtered newly generated receipts`);
            
            return res.json({
              success: true,
              data: {
                taskId: taskId,
                receipts: transformedReceipts
              }
            });
          }
        } catch (genError) {
          console.error(`❌ Failed to generate receipts for task ${taskId}:`, genError.message);
          return res.status(500).json({
            success: false,
            error: 'Failed to generate receipts',
            message: genError.message
          });
        }
      }
      
      // If task is not completed or receipts couldn't be generated
      console.log(`📄 No receipts available - Task status: ${task.status}`);
      return res.status(404).json({
        success: false,
        error: 'No receipts found for this task',
        message: task.status === 'completed' 
          ? 'Receipts are being generated, please try again in a few moments'
          : 'Receipts will be available when the task is completed'
      });
    }
    
    // Filter receipts based on user's role and get only the latest for each type
    const userRelevantReceipts = [];
    
    // Check if user is poster (paid for the task)
    const paymentReceipts = receipts.filter(r => r.receiptType === 'payment' && r.poster.toString() === userId.toString());
    if (paymentReceipts.length > 0) {
      // Get the most recent payment receipt
      const latestPaymentReceipt = paymentReceipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      userRelevantReceipts.push(latestPaymentReceipt);
      console.log(`📄 Added payment receipt for poster: ${latestPaymentReceipt.receiptNumber}`);
    }
    
    // Check if user is tasker (did the work)
    const earningsReceipts = receipts.filter(r => r.receiptType === 'earnings' && r.tasker.toString() === userId.toString());
    if (earningsReceipts.length > 0) {
      // Get the most recent earnings receipt
      const latestEarningsReceipt = earningsReceipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      userRelevantReceipts.push(latestEarningsReceipt);
      console.log(`📄 Added earnings receipt for tasker: ${latestEarningsReceipt.receiptNumber}`);
    }
    
    // Transform filtered receipts
    const transformedReceipts = userRelevantReceipts.map(receipt => ({
      receiptId: receipt._id,
      receiptNumber: receipt.receiptNumber,
      receiptType: receipt.receiptType,
      amount: receipt.receiptType === 'payment' 
        ? receipt.financial.totalPaid 
        : receipt.financial.amountReceived,
      currency: receipt.financial.currency,
      dateGenerated: receipt.generatedAt,
      downloadCount: receipt.downloadCount,
      canDownload: true,
      status: 'generated' // Ensure receipts are marked as ready for download
    }));
    
    console.log(`📤 Returning ${transformedReceipts.length} filtered receipts (removed duplicates)`);
    
    res.json({
      success: true,
      data: {
        taskId: taskId,
        receipts: transformedReceipts
      }
    });
    
  } catch (error) {
    console.error('Error fetching task receipts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task receipts',
      message: error.message
    });
  }
};

module.exports = {
  getMyReceipts,
  getReceiptById,
  downloadReceiptPDF,
  getTaskReceipts
};