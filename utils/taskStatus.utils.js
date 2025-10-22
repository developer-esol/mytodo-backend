const Task = require("../models/Task");
const Transaction = require("../models/TransActions");

// Calculate votes based on task budget and offer amount
const calculateVotes = (taskBudget, offerAmount) => {
  // Convert both amounts to numbers to ensure proper calculation
  const budget = Number(taskBudget);
  const offer = Number(offerAmount);
  
  // Calculate saved amount (budget - offer)
  const savedAmount = budget - offer;
  
  // Calculate poster votes based on savings
  // For $3400 budget and $3150 offer, saved = $250
  // posterVotes = floor($250 / 10) = 25 votes
  let posterVotes = Math.floor(savedAmount / 10);
  
  // Calculate tasker votes based on earnings
  // For $3150 offer
  // taskerVotes = floor($3150 / 100) = 31 votes
  let taskerVotes = Math.floor(offer / 100);
  
  // Ensure minimum votes (1) and maximum votes (50)
  posterVotes = Math.max(1, Math.min(posterVotes, 50));
  taskerVotes = Math.max(1, Math.min(taskerVotes, 50));
  
  return {
    posterVotes,
    taskerVotes
  };
};

const syncTaskStatus = async (taskId, newStatus) => {
  try {
    // Update task
    const task = await Task.findByIdAndUpdate(
      taskId,
      {status: newStatus},
      {new: true}
    );

    // Update all related transactions
    await Transaction.updateMany({taskId}, {taskStatus: newStatus});

    return task;
  } catch (error) {
    console.error("Error syncing task status:", error);
    throw error;
  }
};

module.exports = {
  syncTaskStatus,
  calculateVotes
};
