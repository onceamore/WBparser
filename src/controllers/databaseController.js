const mongoose = require('mongoose');
const User = require("../schemas/User");


require('dotenv').config();

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

async function closeDatabase() {
  try {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}

async function createUser(userData) {

  const newUser = new User({
    userName: userData.userName,
    userPassword: userData.userPassword
  });


  try {
    const user = await newUser.save();
    console.log('User saved:', user);
  } catch (err) {
    console.error(`Error creating user ${userName} ` + err);
  }
}

async function updateUserTokens(userData) {
  const userName = userData?.userName;
  let updatedUserData

  if (userData?.WbTokens) {
    updatedUserData = {
      userName,
      "WbTokens.standartToken": userData.WbTokens.standartToken,
      "WbTokens.statisticToken": userData.WbTokens.statisticToken,
      "WbTokens.advertisingToken": userData.WbTokens.advertisingToken
    };
  } else if (userData?.OZONTokens) {
    updatedUserData = {
      userName,
      "OzonTokens.client_id": userData.OZONTokens.client_id,
      "OzonTokens.token": userData.OZONTokens.token
    };
  } else {
    return console.log("userTokens is empty!");
  }

  try {
    await User.findOneAndUpdate({ userName: userName }, updatedUserData);
    console.log('User tokens updated:', updatedUserData);
  } catch (err) {
    console.error('Error updating user tokens:', err);
  }
}

async function getAllUsers() {
  try {
    const allUsers = await User.find();
    console.log('All Users:', allUsers);
  } catch (err) {
    console.error(err);
  }
}

module.exports = { connectDatabase, closeDatabase, createUser, updateUserTokens, getAllUsers };

