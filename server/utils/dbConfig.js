const mongoose = require("mongoose");

const dbConnection = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    if (connection) {
        console.log(`db connected`);
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = dbConnection;
