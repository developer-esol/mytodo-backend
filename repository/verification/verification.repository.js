const User = require("../../models/user/User");

const updateUserVerificationSession = async (userId, sessionId) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      "verification.ratifyId.sessionId": sessionId,
      "verification.ratifyId.status": "pending",
    },
    { new: true }
  );
};

const findUserBySessionId = async (sessionId) => {
  return await User.findOne({
    "verification.ratifyId.sessionId": sessionId,
  });
};

const updateUserVerificationStatus = async (userId, verificationResult) => {
  const user = await User.findById(userId);

  if (!user) {
    return null;
  }

  user.verification.ratifyId.status = verificationResult.status;
  user.verification.ratifyId.completedAt = new Date();
  user.verification.ratifyId.details = verificationResult;

  if (verificationResult.status === "verified") {
    user.isVerified = true;
  }

  return await user.save();
};

const findUserById = async (userId) => {
  return await User.findById(userId);
};

module.exports = {
  updateUserVerificationSession,
  findUserBySessionId,
  updateUserVerificationStatus,
  findUserById,
};
