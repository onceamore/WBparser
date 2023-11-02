const axios = require('axios');
const advKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NJRCI6Ijc4MjgxMzQ4LWE0ZGItNDYyYi1iNTJmLTU5M2UwYzQ0ZTg3YSJ9.9BXh0j9UPvUAM4K5ePFpTxPmhmkVDF4B0OmJcXasApk"
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))



async function campaignList() {
    const url = "https://advert-api.wb.ru/adv/v0/adverts"

    const params = {
        "headers": {
            "Authorization": advKey,
        }
    }

    const campaignList = await axios.get(url, params);

    return campaignList.data

}

async function getDetailData(id) {
    console.log(id)

    const begin = '2023-10-01'

    const url = `https://advert-api.wb.ru/adv/v1/fullstat?id=${id}&begin=${begin}`

    const params = {
        "headers": {
            "Authorization": advKey,
        }
    }

    const response = await axios.get(url, params);

    return (response.data)
}

(async () => {
    const campaigns = await campaignList()

    for (let i = 0; i < campaigns.length; i++) {
        try {
            await delay(5000)
            const campaignData = (await getDetailData(campaigns[i].advertId))
            const campaignDays = campaignData.days

            campaignDays.forEach(day => {
                const apps = day.apps

                const metricsByNmId = {};

                apps.forEach(app => {
                    app.nm.forEach(nmItem => {
                        const nmId = nmItem.nmId;
                        if (!metricsByNmId[nmId]) {
                            metricsByNmId[nmId] = {
                                views: 0,
                                clicks: 0,
                                frq: 0,
                                unique_users: 0,
                                ctr: 0,
                                cpc: 0,
                                sum: 0,
                                atbs: 0,
                                orders: 0,
                                cr: 0,
                                shks: 0,
                                sum_price: 0
                            };
                        }

                        metricsByNmId[nmId].views += nmItem.views;
                        metricsByNmId[nmId].clicks += nmItem.clicks;
                        metricsByNmId[nmId].frq += nmItem.frq;
                        metricsByNmId[nmId].unique_users += nmItem.unique_users;
                        metricsByNmId[nmId].ctr += nmItem.ctr;
                        metricsByNmId[nmId].cpc += nmItem.cpc;
                        metricsByNmId[nmId].sum += nmItem.sum;
                        metricsByNmId[nmId].atbs += nmItem.atbs;
                        metricsByNmId[nmId].orders += nmItem.orders;
                        metricsByNmId[nmId].cr += nmItem.cr;
                        metricsByNmId[nmId].shks += nmItem.shks;
                        metricsByNmId[nmId].sum_price += nmItem.sum_price;
                    });
                });
                console.log(metricsByNmId)
            });
        } catch (e) {
            console.error(e)
        }
    }
})()