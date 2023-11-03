const mongoose = require('mongoose');

const metricsSchema = new mongoose.Schema({
    views: {
        type: Number,
    },
    clicks: {
        type: Number,
    },
    frq: {
        type: Number,
    },
    unique_users: {
        type: Number,
    },
    ctr: {
        type: Number,
    },
    cp: {
        type: Number,
    },
    sum: {
        type: Number,
    },
    atbs: {
        type: Number,
    },
    orders: {
        type: Number,
    },
    cr: {
        type: Number,
    },
    shks: {
        type: Number,
    },
    sum_price: {
        type: Number,
    }
})

const daysSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    metrics: [metricsSchema]
});

const NmIdsSchema = new mongoose.Schema({
    nmid: {
        type: String,
        required: true
    },
    days: { daysSchema }
});


const campaignSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    dailyBudget: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    nmids: [NmIdsSchema]
});


const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
