const APP_NAME = "alert"
const PORT = 3000




const app = require('express')()
const bodyParser = require('body-parser')
const helmet = require('helmet')

const FCM = require('fcm-node')
const serverKey = require(`${__dirname}/../sense-ele-firebase-service-account.json`)
const fcm = new FCM(serverKey)

app.use(helmet())
app.use(bodyParser.json())

app.listen(PORT, () => {
    console.log(`${APP_NAME} listening on port ${PORT}...`)
})

app.post('/alert', (req, res) => {

    const node = req.body['event']['data']['new']['node_device_id'];
    const node_deployment_id = req.body['event']['data']['new']['node_deployment_id'];
    console.log([node, node_deployment_id]);
    const message = {
        to: `/topics/${node_deployment_id}`,
        notification: {
            title: `Alert 🚨🚨`,
            body: `seeing conflicts at node ${node}`,
        },
    }

    fcm.send(message, function (err, response) {
        if (err) {
            console.log(`Something has gone wrong! ${err}`)

            res.status(500).send(`Something went wrong! ${err}🚨🚨`)
        } else {
            console.log(`Sent alert for node ${node}`)
        }
    })
    res.send(`sent alert for node ${node}`);
});
