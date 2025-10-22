// test-pdf-generation.js
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const testPDFGeneration = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const Receipt = require('./models/Receipt');
    const { generateReceiptPDF } = require('./services/receiptService');
    
    console.log('🧪 Testing MyToDoo PDF generation...');
    
    // Find the latest MyToDoo receipt
    const receipt = await Receipt.findOne({ 
      receiptNumber: { $regex: /^MT/ } 
    }).sort({ createdAt: -1 });
    
    if (!receipt) {
      console.log('❌ No MyToDoo receipts found');
      return;
    }
    
    console.log('📄 Found receipt:', receipt.receiptNumber);
    
    // Generate PDF
    console.log('🔄 Generating PDF with MyToDoo branding...');
    const pdfDoc = await generateReceiptPDF(receipt._id);
    
    // Save PDF to file for testing
    const outputPath = `./test-receipt-${receipt.receiptNumber}.pdf`;
    const writeStream = fs.createWriteStream(outputPath);
    
    pdfDoc.pipe(writeStream);
    pdfDoc.end();
    
    writeStream.on('finish', () => {
      console.log('✅ PDF generated successfully!');
      console.log(`📁 Saved to: ${outputPath}`);
      console.log('🎨 PDF includes:');
      console.log('  - MyToDoo logo in top right');
      console.log('  - Receipt number starting with "MT"');
      console.log('  - Company name: MyToDoo');
      console.log('  - Email: support@mytodoo.com');
      console.log('  - Footer: "Thank you for using MyToDoo!"');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

testPDFGeneration();