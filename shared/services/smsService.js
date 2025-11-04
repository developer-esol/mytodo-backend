const twilio = require("twilio");
const logger = require("../../config/logger");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (to, message) => {
  try {
    const formattedPhone = to.startsWith("+") ? to : `+${to}`;

    const response = await client.messages.create({
      body: message,
      to: formattedPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    logger.info("SMS sent successfully", {
      service: "smsService",
      function: "sendSMS",
      to: formattedPhone,
      messageId: response.sid,
    });
    return response;
  } catch (error) {
    logger.error("Failed to send SMS", {
      service: "smsService",
      function: "sendSMS",
      to,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = { sendSMS };
