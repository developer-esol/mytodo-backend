const mongoose = require('mongoose');
const Offer = require('./models/Offer');

async function checkOffers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mytodo');
    
    const taskId = '68eb385d8e68b13383514220';
    console.log('All offers for task', taskId, ':');
    
    const offers = await Offer.find({ taskId: taskId });
    console.log('Found', offers.length, 'offers');
    
    offers.forEach((offer, index) => {
      console.log(`${index + 1}. Offer ID: ${offer._id}`);
      console.log('   TaskTakerId:', offer.taskTakerId.toString());
      console.log('   Amount:', offer.offer.amount);
      console.log('   Status:', offer.status);
      console.log('   Created:', offer.createdAt);
      console.log('');
    });
    
    // Also check by user
    const userId = '68d295e638cbeb79a7d7cf8e';
    const userOffers = await Offer.find({ taskTakerId: userId });
    console.log('All offers by user', userId, ':');
    console.log('Found', userOffers.length, 'offers by this user');
    
    userOffers.forEach((offer, index) => {
      console.log(`${index + 1}. Task: ${offer.taskId}, Amount: ${offer.offer.amount}, Status: ${offer.status}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

checkOffers();