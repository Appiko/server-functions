const APP_NAME = "alert"
const PORT = 3000




const app = require('express')()
const bodyParser = require('body-parser')
const helmet = require('helmet')

const FCM = require('fcm-node')
const serverKey = require('./sense-ele-firebase-service-account.json')
const fcm = new FCM(serverKey)

app.use(helmet())
app.use(bodyParser.json())

app.listen(PORT, () => {
    console.log(`${APP_NAME} listening on port ${PORT}...`)
})

app.post('/alert', (req, res) => {

    const node = req.body['event']['data']['new']['node_id'];

    const message = {
        to: ['/topics/all', '/topics/prod_gps_pillar'],
        notification: {
            title: `🚨🚨 Alert!! 🐘🏃`,
            body: `Seeing conflicts at node ${node}`,
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
    res.send(`Sent alert for node ${node}`);
});
