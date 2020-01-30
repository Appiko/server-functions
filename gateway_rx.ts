
const app = require('express')()
const bodyParser = require('body-parser')
const helmet = require('helmet')
const axios = require('axios')


const APP_NAME = "Gateway Rx"
const PORT = 3333


interface Array<T> {
    spliceFirst(): number;
}

Array.prototype.spliceFirst = function () {
    return this.splice(0, 1)[0]
}


app.use(helmet())
app.use(bodyParser.raw())


app.listen(PORT, () => {
    console.log(`${APP_NAME} listening on port ${PORT}...`)
})




app.post('/', (req: any, res: any) => {
    let z = [...req.body]

    if (z.length >= 5) {


        let gateway_dep_id: number = z.spliceFirst()
        let gateway_dev_id: number = getDeviceId(z)

        let result: boolean = true;
        while (z.length !== 0 && result) {
            let packetType: number = z.spliceFirst()
            let payloadLength: number = z.spliceFirst()
            let payload: Array<number> = z.splice(0, payloadLength)

            console.log(`type: ${packetType}, length: ${payloadLength}, payload: ${payload}`)
            result = parsePacket(gateway_dep_id, gateway_dev_id, packetType, payload);
        }
        if (result) {
            res.status(200).send();
        } else {
            res.status(400).send("Something went wrong");
        }
    }
    else {
        res.status(400).send("Not enough data");
    }
});


function parsePacket(gateway_dep_id: number, gateway_dev_id: number, packetType: number, payload: Array<number>) {

    switch (packetType) {
        case 0:
            return parseGatewayPacket(gateway_dep_id, gateway_dev_id, payload)
        case 1:
            return parseRFPacket(gateway_dep_id, gateway_dev_id, payload)
        default:
            console.log("Unknown packet")
            break;
    }
    return true;
}

function parseGatewayPacket(gateway_dep_id: number, gateway_dev_id: number, payload: Array<number>) {
    console.log("GATEWAY PKT")
    if (payload.length < 2) {
        return false;
    }

    let vBattery: number = payload.spliceFirst() * 0.025;
    let vSupply: number = payload.spliceFirst() * 0.025;

    sendGatewayPacket(gateway_dep_id, gateway_dev_id, vBattery, vSupply);
    return true;
}


function parseRFPacket(gateway_dep_id: number, gateway_dev_id: number, payload: Array<number>) {
    console.log("RF PKT")
    if (payload.length < 5) {
        return false;
    }
    let deploymentId = payload.spliceFirst()
    let deviceId = getDeviceId(payload)
    let nodePacketType = payload.spliceFirst()
    let nodeVBattery = payload.spliceFirst() * 0.025

    console.log(`${deploymentId}, ${deviceId}, ${nodePacketType}, ${nodeVBattery}`);
    switch (nodePacketType) {
        case 0:
            console.log("ALIVE")
            sayToNode(deploymentId, deviceId, nodeVBattery, 'alive');
            return true;
            break;
        case 1:
            console.log("SENSING")
            sendAlert(gateway_dep_id, gateway_dev_id, deploymentId, deviceId);
            sayToNode(deploymentId, deviceId, nodeVBattery, 'alive');
            saveData(gateway_dep_id, gateway_dev_id, deploymentId, deviceId, payload);
            return true;
            break;
        case 2:
            console.log("MAINTENANCE")
            sayToNode(deploymentId, deviceId, nodeVBattery, 'maintenance');
            saveData(gateway_dep_id, gateway_dev_id, deploymentId, deviceId, payload);
            return true;
            break;
        default:
            console.log("BAD PACKET")
            break;
    }

    //TODO: Impr/remove
    console.log(`Battery voltage = ${nodeVBattery}; Data = ${payload}`)
    return false;
}

function sendGatewayPacket(gateway_dep_id: number, gateway_dev_id: number, vBattery: number, vSupply: number) {
    let query: String = `mutation MyMutation {
        update_gateway(where: {deployment_id: {_eq: ${gateway_dep_id}}, _and: {device_id: {_eq: ${gateway_dev_id}}, _and: {active: {_eq: true}}}}, _set: {alive: true, battery_voltage: "${vBattery}", supply_voltage: "${vSupply}", last_updated: "now()"}) {
          affected_rows
        }
      }
    `
    talkToDB(query)
}

function sendAlert(gateway_dep_id: number, gateway_dev_id: number, device_dep_id: number, device_id: number) {
    let query = `
    mutation MyMutation {
        insert_alert(objects: {node_deployment_id: ${device_dep_id}, node_device_id: ${device_id}, gateway_deployment_id: ${gateway_dep_id}, gateway_device_id: ${gateway_dev_id}}) {
          affected_rows
        }
      }`;
    talkToDB(query);
}

function getDeviceId(z: Array<number>) {
    return parseInt(`0x${z.splice(0, 2).map(a => a.toString(16).padStart(2, '0')).join('')}`, 16);
}


function saveData(gateway_dep_id: number, gateway_dev_id: number, device_dep_id: number, device_id: number, payload: Array<number>) {
    let payloadString: String = payload.map((x: number) => x.toString(16).padStart(2, '0')).join('');
    console.log("dfs" + payloadString);

    let query = `
    mutation insert_data {
        insert_data(objects: {data: "\\${String('\\x')}${payloadString}", gateway_deployment_id: ${gateway_dep_id}, gateway_device_id: ${gateway_dev_id}, node_deployment_id: ${device_dep_id}, node_device_id: ${device_id}}) {
          affected_rows
        }
      }`;
    talkToDB(query);
}

function sayToNode(deploymentId: number, deviceId: number, vBattery: number, state: String) {
    console.log("Node saying");
    let query = `mutation node_alive {
        update_node(where: {deployment_id: {_eq: ${deploymentId}}, _and: {device_id: {_eq: ${deviceId}}, _and: {active: {_eq: true}}}}, _set: {battery_voltage: "${vBattery}", last_updated: "now()", state: "${state}" }) {
          affected_rows
        }
      }`

    talkToDB(query);
}

// Talking to HasuraAPI
function axiosQuery(query: String) {
    return {
        method: 'POST',
        url: process.env.GQLENDPOINT,
        data: { query: query },
        headers: {
            'x-hasura-admin-secret': process.env.HASURASECRET,
        },
    }
};

async function talkToDB(query: String) {
    let res = await axios(axiosQuery(query));
    return res['data']['data'];
}
