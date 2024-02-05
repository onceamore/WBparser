const { campaignList, saveToDbCampaignData, processCampaignData, getDetailData } = require("./campaignController");
const { Article } = require("../schemas/ArticleAdvertData");
const {CheckTokenBytes} = require("../utils");

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const TOKENS_IN_LOAD = [];

const loadAdvertDataByToken = async (token, startDate, endDate) => {
    if(TOKENS_IN_LOAD.includes(token)) return;
    TOKENS_IN_LOAD.push(token);
    const {payload, access} = CheckTokenBytes(token);
    const seller_id = payload["oid"];
    const CLUSTER_LENGTH = 15;
    const campaigns = await campaignList(token);
    const ids = campaigns.map(({advertId}) => advertId);
    console.log(seller_id, `Founded ${ids.length} adverts`);
    for(let CI = 0; CI < ids.length / CLUSTER_LENGTH; CI++) {
        const startSlice = CI * CLUSTER_LENGTH;
        console.log(seller_id, `Processing ${CI + 1} / ${Math.ceil(ids.length / CLUSTER_LENGTH)} (${startSlice} - ${startSlice + CLUSTER_LENGTH})`);
        const sliced = ids.slice(startSlice, startSlice + CLUSTER_LENGTH);
        console.log(seller_id, `Loading ${sliced}`);
        const statistics = await getDetailData(sliced, token, startDate, endDate) || [];
        console.log(seller_id, `Loaded ${statistics.map(({advertId}) => advertId)}`);
        const bulkData = statistics.map(({advertId: advert_id, days}) =>
            days.map(({date, apps}) =>
                apps.map(({appType: app_type, nm}) =>
                    nm.map(({atbs, clicks, cpc, cr, ctr, name, nmId: nm_id, orders, shks, sum, sum_price, views}) => ({
                        updateOne: {
                            filter: { advert_id, date, app_type },
                            update: { $set: {
                                    atbs, clicks, cpc, cr, ctr, name, nm_id, orders, shks, sum, sum_price, views
                                }},
                            upsert: true
                        }
                    }))
                )
            )
        ).flatMap(value => value).flatMap(value => value).flatMap(value => value);
        await Article.bulkWrite(bulkData);
        await delay(1500 * 60);
    }
    TOKENS_IN_LOAD.splice(TOKENS_IN_LOAD.indexOf(token), 1);
    console.log(seller_id, "Ended");
}

const processToken = async (token, startDate, endDate) => {
    console.log("С " + startDate, "По "+endDate)

    const campaigns = await campaignList(token);
    for (let i = 0; i < campaigns.length; i++) {
        console.log(`Processing ${i + 1}/${campaigns.length}: ${campaigns[i].advertId}`);
        try {

            const data = await getDetailData(campaigns[i].advertId, token, endDate, startDate);
            if (data) {
                for (let dayIndex = 0; dayIndex < data.days?.length; dayIndex++) {
                    const day = data.days[dayIndex];
                    for (let appIndex = 0; appIndex < day.apps.length; appIndex++) {
                        const app = day.apps[appIndex];
                        for (let nmIndex = 0; nmIndex < app.nm.length; nmIndex++) {
                            const product = app.nm[nmIndex];
                            if (!(await Article.exists({
                                advert_id: campaigns[i].advertId,
                                app_type: app.appType,
                                nm_id: product.nmId,
                                date: day.date,
                            }))) {
                                Article.create({
                                    advert_id: campaigns[i].advertId,
                                    app_type: app.appType,
                                    nm_id: product.nmId,
                                    date: day.date,
                                    ...product,
                                }).then(r => console.log(`Created ${campaigns[i].advertId}: ${product.nmId} (${app.appType})`));
                            } else {
                                Article.updateOne({
                                    advert_id: campaigns[i].advertId,
                                    app_type: app.appType,
                                    nm_id: product.nmId,
                                    date: day.date,
                                }, {
                                    ...product,
                                }).then(r => console.log(`Updated ${campaigns[i].advertId}: ${product.nmId} (${app.appType})`));
                            }
                        }
                    }
                }
            }
            //await delay(5000);
        } catch (e) {
            if (e.response) {
                console.log("Error", e.response.data);
                i--;
            } else {
                console.log("Error", "Waiting 60", e);
            }
            await delay(20000);
        }

    }
}

const aggregateStatistic = async (token) => {
    const campaigns = (await campaignList(token)).map(advert => advert.advertId);
    return Article.aggregate([
        {
            $match: { advert_id: { $in: campaigns } }
        },
        {
            $group: {
                _id: {
                    date: "$date",
                    nm_id: "$nm_id"
                },
                views: { $sum: "$views" },
                clicks: { $sum: "$clicks" },
                sum: { $sum: "$sum" },
                atbs: { $sum: "$atbs" },
                orders: { $sum: "$orders" },
                shks: { $sum: "$shks" },
                sum_price: { $sum: "$sum_price" },
            }
        },
        {
            $project: {
                _id: 0,
                nm_id: "$_id.nm_id",
                date: "$_id.date",
                views: 1,
                clicks: 1,
                sum: 1,
                atbs: 1,
                orders: 1,
                shks: 1,
                sum_price: 1,
                ctr: {
                    $cond: {
                        if: { $ne: ["$views", 0] },
                        then: { $multiply: [{ $divide: ["$clicks", "$views"] }, 100] },
                        else: 0 // or any other value you want to set for division by 0
                    }
                },
                cr: {
                    $cond: {
                        if: { $ne: ["$views", 0] },
                        then: { $multiply: [{ $divide: ["$shks", "$views"] }, 100] },
                        else: 0 // or any other value you want to set for division by 0
                    }
                },
                cpo: {
                    $cond: {
                        if: { $ne: ["$shks", 0] },
                        then: { $multiply: [{ $divide: ["$sum", "$shks"] }, 100] },
                        else: 0 // or any other value you want to set for division by 0
                    }
                }
            }
        },
        {
            $sort: { date: 1 } // 1 for ascending order, -1 for descending order
        }
    ])
}

const aggregateStatisticByDate = async (token, endDate, startDate) => {

    console.log(startDate, endDate)
    
    const campaigns = (await campaignList(token)).map(advert => advert.advertId);
    return Article.aggregate([
        {
            $match: {
                advert_id: { $in: campaigns },
                date: { $gte: startDate, $lte: endDate },
            }
        },
        {
            $group: {
                _id: {
                    nm_id: "$nm_id"
                },
                views: { $sum: "$views" },
                clicks: { $sum: "$clicks" },
                sum: { $sum: "$sum" },
                atbs: { $sum: "$atbs" },
                orders: { $sum: "$orders" },
                shks: { $sum: "$shks" },
                sum_price: { $sum: "$sum_price" },
            }
        },
        {
            $project: {
                _id: 0,
                nm_id: "$_id.nm_id",
                views: 1,
                clicks: 1,
                sum: 1,
                atbs: 1,
                orders: 1,
                shks: 1,
                sum_price: 1,
                ctr: {
                    $cond: {
                        if: { $ne: ["$views", 0] },
                        then: { $multiply: [{ $divide: ["$clicks", "$views"] }, 100] },
                        else: 0 // or any other value you want to set for division by 0
                    }
                },
                cr: {
                    $cond: {
                        if: { $ne: ["$views", 0] },
                        then: { $multiply: [{ $divide: ["$shks", "$views"] }, 100] },
                        else: 0 // or any other value you want to set for division by 0
                    }
                },
                cpo: {
                    $cond: {
                        if: { $and: [{ $ne: ["$shks", 0] }, { $ne: ["$sum", 0] }] },
                        then: { $divide: ["$sum", "$shks"] },
                        else: 0 // or any other value you want to set for division by 0
                    }
                },
                drr: {
                    $cond: {
                        if: { $and: [{ $ne: ["$shks", 0] }, { $ne: ["$sum", 0] }] },
                        then: { $multiply: [{ $divide: ["$sum", "$sum_price"] }, 100] },
                        else: 0 // or any other value you want to set for division by 0
                    }
                }
            }
        }
    ])
}

module.exports = {
    processToken,
    aggregateStatistic,
    aggregateStatisticByDate,
    loadAdvertDataByToken,
    TOKENS_IN_LOAD
}