const mongoose = require('mongoose');
const Task = require('./models/Task');
const Offer = require('./models/Offer');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixOfferCurrencies() {
  try {
    console.log('🔍 Checking for offers with mismatched currencies...');
    
    // Get all tasks with their currencies
    const tasks = await Task.find({}, { _id: 1, currency: 1 }).lean();
    const taskCurrencyMap = {};
    tasks.forEach(task => {
      taskCurrencyMap[task._id.toString()] = task.currency;
    });
    
    console.log(`📊 Found ${tasks.length} tasks`);
    
    // Get all offers
    const offers = await Offer.find({}).lean();
    console.log(`📊 Found ${offers.length} offers`);
    
    let mismatchedOffers = [];
    let fixedCount = 0;
    
    for (const offer of offers) {
      const taskCurrency = taskCurrencyMap[offer.taskId.toString()];
      const offerCurrency = offer.offer?.currency;
      
      if (taskCurrency && offerCurrency && taskCurrency !== offerCurrency) {
        console.log(`❌ Mismatch found - Task ${offer.taskId}: task currency=${taskCurrency}, offer currency=${offerCurrency}`);
        mismatchedOffers.push({
          offerId: offer._id,
          taskId: offer.taskId,
          taskCurrency,
          offerCurrency,
          amount: offer.offer.amount
        });
        
        // Fix the offer currency
        await Offer.findByIdAndUpdate(offer._id, {
          'offer.currency': taskCurrency
        });
        
        fixedCount++;
        console.log(`✅ Fixed offer ${offer._id} - changed currency from ${offerCurrency} to ${taskCurrency}`);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`- Total offers checked: ${offers.length}`);
    console.log(`- Mismatched offers found: ${mismatchedOffers.length}`);
    console.log(`- Offers fixed: ${fixedCount}`);
    
    if (mismatchedOffers.length > 0) {
      console.log('\n🔧 Fixed the following offers:');
      mismatchedOffers.forEach(offer => {
        console.log(`  - Offer ${offer.offerId} for task ${offer.taskId}: ${offer.offerCurrency} → ${offer.taskCurrency} (amount: ${offer.amount})`);
      });
    } else {
      console.log('\n✨ No currency mismatches found!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing offer currencies:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
fixOfferCurrencies();
