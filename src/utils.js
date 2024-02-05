const jwt = require("jsonwebtoken");

const decodeJwt = (data) => {
    try {
        return jwt.decode(data);
    } catch (e) {

    }
}

const CheckTokenBytes = (token) => {
    const access = {
        sandbox: false,
        content: false,
        analytics: false,
        prices: false,
        marketplace: false,
        statistic: false,
        advertising: false,
        feedbacks: false,
        recommendations: false,
        read_only: false,
    }
    const access_dictionary = {
        0: "sandbox",
        1: "content",
        2: "analytics",
        3: "prices",
        4: "marketplace",
        5: "statistic",
        6: "advertising",
        7: "feedbacks",
        8: "recommendations",
        30: "read_only"
    }
    let payload = decodeJwt(token);
    if(payload && !payload["id"] && !payload["s"] && !payload["sid"] && !payload["uid"]) return {payload, access};

    const { s } = payload;
    const binary = s.toString(2);
    for(let i = 0; i < binary.length; i++) {
        const byte = Number.parseInt(binary[i]);
        const byte_position = binary.length - i - 1;
        if(byte !== 0) {
            access[access_dictionary[byte_position]] = byte === 1;
        }
    }

    return {payload, access};
}

module.exports = {
    decodeJwt,
    CheckTokenBytes
}