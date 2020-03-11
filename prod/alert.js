const APP_NAME = "alert"
// NEVER TODO: if you really want to change the port number change it in `gateway_rx.ts` and recompile.
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

    const nodeId = req.body['event']['data']['new']['node_device_id'];
    const nodeDeploymentId = req.body['event']['data']['new']['node_deployment_id'];
    console.log([nodeId, nodeDeploymentId]);
    const message = {
        to: `/topics/${nodeDeploymentId}`,
        notification: {
            title: `Alert 🚨🚨`,
            body: `seeing conflicts at node ${nodeId}`,
            tag: `alter/${nodeDeploymentId}/${nodeId}`
        },
    }

    fcm.send(message, function (err, response) {
        if (err) {
            console.log(`Something went wrong! ${err}`)
            res.status(500).send(`Something went wrong! ${err}🚨🚨`)
        } else {
            console.log(`Sent alert for node ${nodeId}`)
        }
    })
    res.send(`sent alert for node ${nodeId}`);
});


app.post('/gps/:deploymentId/:deviceId', (req, res) => {

    const nodeId = req.params['deviceId'];
    const nodeDeploymentId = req.params['deploymentId']
    console.log(`GPS lost on node ${nodeId}`);
    const message = {
        to: `/topics/${nodeDeploymentId}`,
        notification: {
            title: `GPS Signal Lost 📡📡`,
            body: `GPS signals lost on node ${nodeId}`,
            tag: `gps/${nodeDeploymentId}/${nodeId}`
        },
    }

    fcm.send(message, function (err, response) {
        if (err) {
            console.log(`Something went wrong! ${err}`)
            res.status(500).send(`Something went wrong! ${err}🚨🚨`)
        } else {
            console.log(`Sent gps alert for node (${nodeDeploymentId},${nodeId})`)
        }
    })
    res.send(`sent alert for node ${nodeId}`);
});
