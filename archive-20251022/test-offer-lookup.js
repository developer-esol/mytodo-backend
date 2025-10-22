// Quick test for the join endpoint with correct field
const mongoose = require('mongoose');
const Offer = require('./models/Offer');

async function testOfferLookup() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mytodo');
    
    const taskId = '68eb385d8e68b13383514220';
    const userId = '68d295e638cbeb79a7d7cf8e';
    
    console.log('Testing offer lookup with correct field name...');
    console.log('Task ID:', taskId);
    console.log('User ID:', userId);
    
    // Test with old field name (should fail)
    const wrongOffer = await Offer.findOne({
      taskId: taskId,
      freelancerId: userId
    });
    console.log('Wrong field (freelancerId) result:', !!wrongOffer);
    
    // Test with correct field name (should work)
    const correctOffer = await Offer.findOne({
      taskId: taskId,
      taskTakerId: userId
    });
    console.log('Correct field (taskTakerId) result:', !!correctOffer);
    
    if (correctOffer) {
      console.log('✅ Found offer:', {
        id: correctOffer._id,
        amount: correctOffer.offer.amount,
        currency: correctOffer.offer.currency,
        status: correctOffer.status
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

testOfferLookup();