
const app = require('express')()
const helmet = require('helmet')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')


app.use(helmet())
app.use(bodyParser.raw())



const APP_NAME = "ELE SERVO TEST"
const PORT = 3335

const RF_PREFIX = "rf"
const ALIVE_FILE = "alive_log"
const MAINTAIN_FILE = "maintain_log"
const ALERT_FILE = "alert_log"
const DIR_NAME = `${__dirname}/logs/ele-servo-logs`

Array.prototype.spliceFirst = function () {
    return this.splice(0, 1)[0];
};

let dir = path.join(__dirname, DIR_NAME);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log(`Creating dir ${dir}`);
}

app.get(`/:id/:up`, (req, res) => {
    id = req.params.id;
    up = req.params.up;

    try {
        logEsp(id, parseInt(up) ? `up` : `down`);
        res.sendStatus(200);
    } catch (error) {
        console.dir(error);
        res.sendStatus(400);
    }
})

app.post('/', (req, res) => {
    let z = [...req.body];
    if (z.length >= 5) {
        let gateway_dep_id = z.spliceFirst();
        let gateway_dev_id = getDeviceId(z);
        let result = true;
        while (z.length !== 0 && result) {
            let packetType = z.spliceFirst();
            let payloadLength = z.spliceFirst();
            let payload = z.splice(0, payloadLength);
            console.log(`type: ${packetType}, length: ${payloadLength}, payload: ${payload}`);
            result = parsePacket(gateway_dep_id, gateway_dev_id, packetType, payload);
        }
        if (result) {
            res.status(200).send();
        }
        else {
            res.status(400).send("Something went wrong");
        }
    }
    else {
        res.status(400).send("Not enough data");
    }
});

function parsePacket(gateway_dep_id, gateway_dev_id, packetType, payload) {
    switch (packetType) {
        case 0:
            return;
        case 1:
            return parseRFPacket(gateway_dep_id, gateway_dev_id, payload);
        default:
            console.log("Unknown packet");
            logErr(`Unknown Packet type ${packetType}`)
            break;
    }
    return true;
}

function parseRFPacket(gateway_dep_id, gateway_dev_id, payload) {
    console.log("RF PKT");
    if (payload.length < 5) {
        return false;
    }
    let deploymentId = payload.spliceFirst();
    let deviceId = getDeviceId(payload);
    let nodePacketType = payload.spliceFirst();
    let nodeVBattery = payload.spliceFirst() * 0.025;
    switch (nodePacketType) {
        case 0:
            console.log("ALIVE");
            logToFile(RF_PREFIX, ALIVE_FILE, `${deploymentId},${deviceId},${nodeVBattery}V`);
            return true;
            break;
        case 1:
            console.log("SENSING");
            logToFile(RF_PREFIX, ALERT_FILE, `${deploymentId},${deviceId},${nodeVBattery}V,${payload}`);
            return true;
            break;
        case 2:
            console.log("MAINTENANCE");
            logToFile(RF_PREFIX, MAINTAIN_FILE, `${deploymentId},${deviceId},${nodeVBattery}V,${payload}`);
            return true;
            break;
        default:
            console.log("BAD PACKET");
            logErr(`Node packet type: ${nodePacketType}`)
            break;
    }
    //TODO: Impr/remove
    console.log(`Battery voltage = ${nodeVBattery}V; Data = ${payload}`);
    return false;
}

function getDeviceId(z) {
    return parseInt(`0x${z.splice(0, 2).map(a => a.toString(16).padStart(2, '0')).join('')}`, 16);
}


app.listen(PORT, () => console.log(`${APP_NAME} listening on port ${PORT}`))

function logToFile(type, log_type, data) {
    let filePath = `${dir}/${type}_${log_type}`;
    let fileContents = data + ',' + Date() + '\n';
    fs.appendFile(filePath, fileContents, function (err) {
        if (err) {
            console.log(err);
        }
    });
}

function logErr(data) {
    let filePath = `${dir}/err`;
    let fileContents = data + ',' + Date() + '\n';

    fs.appendFile(filePath, fileContents, function (err) {
        if (err) {
            console.log(err);
        }
    });
}

function logEsp(id, state) {
    let filePath = `${dir}/${id}_log`;
    let fileContents = state + ',' + Date() + '\n';
    fs.appendFile(filePath, fileContents, function (err) {
        if (err) {
            console.log(err);
        }
    });
}

