const axios = require('axios');
const mongoose = require('mongoose');
const Campaign = require("../schemas/Campaigns");
const moment = require("moment");

async function campaignList(advToken) {
    //const url = "https://advert-api.wb.ru/adv/v0/adverts"
    const url = "https://advert-api.wb.ru/adv/v1/promotion/count";

    const params = {
        "headers": {
            "Authorization": advToken,
        }
    }

    const campaignList = await axios.get(url, params)
        .then(r => {
            if (r.status === 200) {
                const list = [];
                r.data.adverts.forEach(item => {
                    const {type, status, advert_list} = item;
                    advert_list.forEach(ad => {
                        list.push({
                            type, status, ...ad
                        })
                    })
                })
                return list;
            }
            return [];
        })
        .catch(e => {
            console.log(e.toString());
            console.log("Failed token:", advToken);
            return [];
        });

    return campaignList;
}

async function getDetailData(ids, token, dateFrom, dateTo) {

    const url = `https://advert-api.wb.ru/adv/v2/fullstats`;
    const params = {
        "headers": {
            "Authorization": token,
        }
    }
    const body = ids.map(id => ({
        id, interval: { begin: moment(dateFrom).format("YYYY-MM-DD"), end: moment(dateTo).format("YYYY-MM-DD") }
    }))
    return await axios.post(url, body, params)
        .then(result => result.data)
        .catch(err => {
            console.log(body, err?.status, err?.response);
            return null
        })
}

const processCampaignData = async (campaignData, token) => {
    const campaignDetailData = await getDetailData(campaignData.id, token, "01-01-2023", "03-11-2023");

    if (campaignDetailData === null) {
        return null; // Return null if campaignDetailData is null
    }

    const result = {
        advertId: campaignDetailData.advertId,
        nms: []
    };

    campaignDetailData.days.forEach(day => {
        try {
            day.apps.forEach(app => {
                app.nm.forEach(nmData => {
                    const nmId = nmData.nmId;
                    const date = day.date;

                    const nmIndex = result.nms.findIndex(nm => nm.nmId === nmId);

                    if (nmIndex === -1) {
                        result.nms.push({
                            nmId: nmId,
                            dates: [{
                                date: date,
                                metrics: {
                                    views: 0,
                                    clicks: 0,
                                    ctr: 0,
                                    cpc: 0,
                                    sum: 0,
                                    atbs: 0,
                                    orders: 0,
                                    cr: 0,
                                    shks: 0,
                                    sum_price: 0
                                }
                            }]
                        });
                    } else {
                        // If nmId is found, ensure that the dates array and metrics object exist
                        if (!result.nms[nmIndex].dates) {
                            result.nms[nmIndex].dates = [];
                        }
                        const dateIndex = result.nms[nmIndex].dates.findIndex(d => d.date === date);
                        if (dateIndex === -1) {
                            result.nms[nmIndex].dates.push({
                                date: date,
                                metrics: {
                                    views: 0,
                                    clicks: 0,
                                    ctr: 0,
                                    cpc: 0,
                                    sum: 0,
                                    atbs: 0,
                                    orders: 0,
                                    cr: 0,
                                    shks: 0,
                                    sum_price: 0
                                }
                            });
                        }
                    }
                });
            });
        } catch (err) {
            console.log(err);
        }
    });
    return result;
};




const saveToDbCampaignData = async (campaign) => {
    const campaignData = await Campaign.findOne({ id: campaign.advertId });

    if (campaignData) {
        campaignData.nmids = campaign.nms
        await campaignData.save();

        console.log('Campaign saved');
    } else {
        const newCampaign = new Campaign({
            id: campaign.advertId,
            name: campaign.name,
            dailyBudget: campaign.dailyBudget,
            startDate: campaign.startTime,
            endDate: campaign.endTime,
            status: campaign.status
        });

        await newCampaign.save();
        console.log('New campaign saved');
    }
}

const getAllCampaignsFromDb = async (username) => {
    const campaignsList = await Campaign.find({});
    return campaignsList
}

module.exports = {
    campaignList,
    getDetailData,
    processCampaignData,
    saveToDbCampaignData,
    getAllCampaignsFromDb
};
