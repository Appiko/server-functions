const axios = require('axios');
const FCM = require('fcm-node')
const serverKey = require(`${__dirname}/../../sense-ele-firebase-service-account.json`)
const fcm = new FCM(serverKey)

interval = process.argv[2];
deployment_id = process.argv[3];

console.log([interval, deployment_id]);

const query = {
    "query": `query {getdeadnodes(args: {dep_id: ${deployment_id}, diff_time: "${interval}"}){device_id}}`
}
const axiosQuery = {
    method: 'POST',
    url: process.env.GQLENDPOINT,
    data: query,
    headers: {
        'x-hasura-admin-secret': process.env.HASURASECRET,
    },
};

var deadNodes = [];

axios(axiosQuery)
    .then((x) => {
        deadNodes = x['data']['data']['getdeadnodes'];
        console.log(deadNodes);
        if (deadNodes.length > 0) {
            console.log(`Found ${deadNodes.length} dead notes, sending notification`)
            const message = {
                to: `/topics/${deployment_id}`,
                notification: {
                    title: `Dead Nodes 💀💀 `,
                    body: `${deadNodes.length} ${deadNodes.length > 1 ? 'nodes are' : 'node is'} dead.`,
                    tag: 'dead_node'
                },
            }
            fcm.send(message, function (err, response) {
                if (err) {
                    console.log(`[DEAD_NODE] Something went wrong! ${err}`)
                    process.exit(1);
                } else {
                    console.log(`Sent Dead nodes alert`)
                    process.exit(0);
                }
            })
        } else {
            console.log("No dead nodes found...")
            process.exit(1);
        }

    })
    .catch(e => console.log(e));
