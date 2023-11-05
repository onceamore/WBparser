const mongoose = require('mongoose');
const {Schema} = require("mongoose");

const ArticleSchema = new Schema({
    advert_id: Number,
    app_type: Number,
    nm_id: Number,
    date: Date,
    views: Number,
    clicks: Number,
    frq: Number,
    unique_users: Number,
    ctr: Number,
    sum: Number,
    atbs: Number,
    orders: Number,
    cr: Number,
    shks: Number,
    sum_price: Number
});

const Article = mongoose.model('Article', ArticleSchema);

module.exports = {
    Article
}