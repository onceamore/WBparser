const mongoose = require("mongoose");
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))


const { campaignList, getDetailData, processCampaignData, saveToDbCampaignData, getAllCampaignsFromDb } = require('./src/controllers/campaignController');

const { connectDatabase, closeDatabase, createUser, updateUserTokens, getAllUsers } = require('./src/controllers/databaseController');
const { processToken, aggregateStatistic, aggregateStatisticByDate } = require("./src/controllers/articleController");

require('dotenv').config();

const app = express();
const port = 3030;

app.use(bodyParser.json());
app.use(morgan('dev'));

connectDatabase();

app.post('/user/createUser', async (req, res) => {

    try {
        const userName = req.body.userName
        const userPassword = req.body.userPassword

        const userData = {
            userName,
            userPassword
        }

        await createUser(userData);
        res.send('User created');

    } catch (err) {
        res.send('User creation failed:' + err);
    }

});

app.post('/user/updateusertokens', async (req, res) => {

    try {
        await updateUserTokens(req.body);
        res.send('User tokens updated');

    } catch (err) {
        res.send('User updation failed:' + err);
    }

});

app.post('/wbadv/parseusercampaigns', async (req, res) => {
    try {
        const campaigns = await campaignList(req.body.token);

        campaigns.forEach(campaign => {
            console.log(campaign);
            saveToDbCampaignData(campaign);
        })

        return res.send('Campaigns parsed successfully');

    } catch (err) {
        res.send('User updation failed:' + err);
    }
});

app.post('/wbadv/updateAllCampaigns', async (req, res) => {
    try {
        userName = req.body.userName;

        const campaigns = await getAllCampaignsFromDb();

        for (let i = 0; i < 3/*campaigns.length*/; i++) {
            const updatedCampaign = await processCampaignData(campaigns[i], req.headers.token);
            saveToDbCampaignData(updatedCampaign)
            await delay(5000);
        }

        res.send('Campaigns updated successfully');

    } catch (err) { res.send('Campaign updation failed:' + err); }
});


app.post('/wbadv/loadAdsByToken', async (req, res, next) => {
    const { token, type } = req.body;

    if (token && type) {

        if (type === 'week') {
            const { startDate, endDate } = todayOffsetDays(1, 8, true)
            console.log(startDate, endDate)
            processToken(token, startDate, endDate);
            res.status(200).json({ message: "ok" });
        }

    } else {
        res.status(200).json({ message: "not ok" });
    }
});

app.post('/wbadv/getStatisticByToken', async (req, res, next) => {
    const { token, type } = req.body;

    if (token && type) {
        if (type === 'week') {
            const { startDate, endDate } = todayOffsetDays(1, 8, false)
            const data = (await aggregateStatisticByDate(token, startDate, endDate));
            res.status(200).json({ message: "ok", count: data.length, data });
        }

    } else {
        res.status(200).json({ message: "not ok" });
    }
});


function todayOffsetDays(toOffset = 0, fromOffset = 0, string = false) {

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - toOffset)
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - fromOffset);
    endDate.setUTCHours(0, 0, 0, 0);

    if (string === true) {
        return {
            startDate: formatDateAsDDMMYYYY(startDate),
            endDate: formatDateAsDDMMYYYY(endDate)
        }
    } else {
        return {
            startDate,
            endDate
        }
    }
}

function formatDateAsDDMMYYYY(date) {
    const day = date.getDate().toString().padStart(2, '0'); // Get the day and pad with leading zero if necessary
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get the month (adding 1 as it's zero-based) and pad with leading zero
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
}



app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

