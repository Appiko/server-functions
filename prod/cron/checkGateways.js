const axios = require('axios');
const FCM = require('fcm-node')
const serverKey = require(`${__dirname}/../../sense-ele-firebase-service-account.json`)
const fcm = new FCM(serverKey)

interval = process.argv[2];
deployment_id = process.argv[3];

const query = {
    "query": `query {getdeadgateways(args: {dep_id: ${deployment_id}, diff_time: "${interval}"}){device_id}}`
}
const axiosQuery = {
    method: 'POST',
    url: process.env.GQLENDPOINT,
    data: query,
    headers: {
        'x-hasura-admin-secret': process.env.HASURASECRET,
    },
};

var deadgateways = [];

axios(axiosQuery)
    .then((x) => {
        console.log(x['data']);
        deadgateways = x['data']['data']['getdeadgateways'];
        console.log(deadgateways);
        if (deadgateways.length > 0) {
            console.log(`Found ${deadgateways.length} dead gateways, sending notification`)
            const message = {
                to: `/topics/${deployment_id}`,
                notification: {
                    title: `Dead gateways 💀💀`,
                    body: `${deadgateways.length} ${deadgateways.length > 1 ? 'gateways are' : 'gateway is'} dead.`,
                    tag: 'dead_gateway'
                },
            }
            fcm.send(message, function (err, response) {
                if (err) {
                    console.log(`[DEAD_NODE] Something went wrong! ${err}`)
                    process.exit(1);
                } else {
                    console.log(`Sent Dead gateways alert`)
                    process.exit(0);
                }
            })
        } else {
            console.log("No dead gateways found...")
            process.exit(1);
        }

    })
    .catch(e => console.log(e));
