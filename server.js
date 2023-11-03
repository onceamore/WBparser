const mongoose = require("mongoose");
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))


const { campaignList, getDetailData, processCampaignData, saveToDbCampaignData, getAllCampaignsFromDb } = require('./src/controllers/campaignController');

const { connectDatabase, closeDatabase, createUser, updateUserTokens, getAllUsers } = require('./src/controllers/databaseController');

require('dotenv').config();

const app = express();
const port = 3030;

app.use(bodyParser.json());

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


app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

