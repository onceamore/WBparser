const mongoose = require('mongoose');

const WbTokensSchema = new mongoose.Schema({
    advertisingToken: {
        type: 'string',
    },
    standartToken: {
        type: 'string',
    },
    statisticToken: {
        type: 'string',
    },
});

const OzonTokensSchema = new mongoose.Schema({
    client_id: {
        type: 'string',
    },
    token: {
        type: 'string',
    }
});

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        unique: true,
        required: true
    },
    userPassword: {
        type: String,
        required: true
    },
    WbTokens: WbTokensSchema,
    OzonTokens: OzonTokensSchema,
});

const User = mongoose.model('User', userSchema);

module.exports = User;