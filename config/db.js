const mongoose = require('mongoose');

const localMongoUri = 'mongodb://127.0.0.1:27017/academicrepo';

const connectDB = async () => {
  const configuredUri = process.env.MONGO_URI;
  const uriToUse = configuredUri || localMongoUri;

  try {
    const conn = await mongoose.connect(uriToUse, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    const message = error && error.message ? error.message : String(error);

    if (configuredUri) {
      console.error('MongoDB connection failed using MONGO_URI.');
      console.error(`Configured URI: ${configuredUri.replace(/:[^@]*@/, ':***@')}`);
      console.error(`Details: ${message}`);
      console.error('Check your Atlas username/password, network access, and IP whitelist.');
      return false;
    }

    console.error(`MongoDB is not running locally on ${localMongoUri}`);
    console.error('Either install and start MongoDB Community Server, or set MONGO_URI to your Atlas connection string in the .env file.');
    console.error(`Local DB error: ${message}`);
    return false;
  }
};

module.exports = connectDB;