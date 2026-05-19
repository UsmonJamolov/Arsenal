const mongoose = require("mongoose");

const { mongodbUri } = require("../config");

mongoose.set("strictQuery", true);

async function connectDatabase() {
  await mongoose.connect(mongodbUri);
  console.log(`MongoDB ulandi: ${mongoose.connection.name}`);
}

module.exports = { connectDatabase, mongoose };
