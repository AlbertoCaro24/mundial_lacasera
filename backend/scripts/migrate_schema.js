const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Code = require('../models/Code');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB para migración');

    const cursor = Code.find({ $or: [{ isUsed: { $exists: true } }, { used: { $exists: false } }] }).cursor();
    let count = 0;
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      const update = {};
      if (typeof doc.isUsed !== 'undefined') update.used = doc.isUsed;
      if (doc.usedBy && doc.usedBy.date) update.usedAt = doc.usedBy.date;
      if (doc.usedBy && doc.usedBy.ip) update.ip = doc.usedBy.ip;
      if (!doc.result) update.result = null;

      if (Object.keys(update).length > 0) {
        await Code.findByIdAndUpdate(doc._id, { $set: update });
        count++;
      }
    }

    console.log(`Migración completada. Documentos actualizados: ${count}`);
    process.exit(0);
  } catch (err) {
    console.error('Error en migración:', err);
    process.exit(1);
  }
})();