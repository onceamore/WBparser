const mongoose = require('mongoose');

const metricsSchema = new mongoose.Schema({
    cpc: {
        type: Number,
    },
    cpc: {
        type: Number,
    },
    views: {
        type: Number,
    },
    clicks: {
        type: Number,
    },
    unique_users: {
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
    shks: {
        type: Number,
    },
    sum_price: {
        type: Number,
    },
})

const advSchema = new mongoose.Schema({
    id: {
        type: Number,
    },
    metrics: [metricsSchema]
})

const nmIdSchema = new mongoose.Schema({
    nmId: {
        required: true
    },
    advId: [advSchema]
});

const daySchema = new mongoose.Schema({
    day: {
        type: Date,
        required: true,
    },
    nmIds: [nmIdSchema]
}, { timestamps: true });

const Day = mongoose.model('Day', userSchema);

module.exports = Day;
