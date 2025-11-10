const SmtpSetting = require("../../../models/admin/SmtpSetting");

class AdminEmailRepository {
  async getLatestSmtpSetting() {
    return await SmtpSetting.getLatest();
  }

  async upsertSmtpSetting(update) {
    return await SmtpSetting.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }
}

module.exports = new AdminEmailRepository();
