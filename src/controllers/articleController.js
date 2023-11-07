const { campaignList, saveToDbCampaignData, processCampaignData, getDetailData } = require("./campaignController");
const { Article } = require("../schemas/ArticleAdvertData");

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

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
}