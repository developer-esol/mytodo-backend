const verificationRepository = require("../../repository/verification/verification.repository");
const ratifyIDService = require("../../shared/services/ratifyIDService");

const initializeVerification = async (userId) => {
  const verificationSession = await ratifyIDService.initialize(userId);

  await verificationRepository.updateUserVerificationSession(
    userId,
    verificationSession.id
  );

  return {
    verificationUrl: verificationSession.redirectUrl,
    sessionId: verificationSession.id,
  };
};

const handleCallback = async (sessionId, verificationData) => {
  const verificationResult = await ratifyIDService.verifyCallback(
    verificationData
  );

  const user = await verificationRepository.findUserBySessionId(sessionId);

  if (!user) {
    throw new Error("User not found");
  }

  await verificationRepository.updateUserVerificationStatus(
    user._id,
    verificationResult
  );

  return {
    status: verificationResult.status,
  };
};

const checkVerificationStatus = async (userId) => {
  const user = await verificationRepository.findUserById(userId);

  if (!user?.verification?.ratifyId?.sessionId) {
    throw new Error("No verification session found");
  }

  const status = await ratifyIDService.getVerificationStatus(
    user.verification.ratifyId.sessionId
  );

  return {
    status: status.status,
    completedAt: user.verification.ratifyId.completedAt,
  };
};

module.exports = {
  initializeVerification,
  handleCallback,
  checkVerificationStatus,
};
