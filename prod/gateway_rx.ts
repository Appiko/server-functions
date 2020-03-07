
const app = require('express')()
const bodyParser = require('body-parser')
const helmet = require('helmet')
const axios = require('axios')


const APP_NAME = "Gateway Rx"
const PORT = 3333


interface Array<T> {
    spliceFirst(): number;
}

interface Number {
    toRadians(): number;
}

Array.prototype.spliceFirst = function () {
    return this.splice(0, 1)[0]
}

Number.prototype.toRadians = function () {
    return this.valueOf() * (Math.PI / 180);
}

app.use(helmet())
app.use(bodyParser.raw())


app.listen(PORT, () => {
    console.log(`${APP_NAME} listening on port ${PORT}...`)
})




app.post('/', async (req: any, res: any) => {
    let z = [...req.body]

    if (z.length >= 5) {


        let gateway_dep_id: number = z.spliceFirst()
        let gateway_dev_id: number = getDeviceId(z)

        let result: boolean = true;
        while (z.length !== 0 && result) {
            let packetType: number = 0;
            let payloadLength: number = 0;
            let payload: Array<number> = [];
            if (z.length == 3) {
                packetType = z.spliceFirst()
                payloadLength = 2
                payload = z
            } else {
                packetType = z.spliceFirst()
                payloadLength = z.spliceFirst()
                payload = z.splice(0, payloadLength)
            }
            console.log(`type: ${packetType}, length: ${payloadLength}, payload: ${payload}`)

            result = await parsePacket(gateway_dep_id, gateway_dev_id, packetType, payload);
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
        case 2:
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

    let vBattery: number = payload.spliceFirst() * (3.6 / 255);
    let vSupply: number = payload.spliceFirst() * (3.6 / 255);

    sendGatewayPacket(gateway_dep_id, gateway_dev_id, vBattery, vSupply);
    return true;
}


async function parseRFPacket(gateway_dep_id: number, gateway_dev_id: number, payload: Array<number>) {
    console.log("RF PKT")
    if (payload.length < 5) {
        return false;
    }
    let rssi = payload.spliceFirst()
    let deploymentId = payload.spliceFirst()
    let deviceId = getDeviceId(payload)
    let nodePacketType = payload.spliceFirst()
    let nodeVBattery = payload.spliceFirst() * (3.6 / 255)

    console.log(`${deploymentId}, ${deviceId}, ${nodePacketType}, ${nodeVBattery}`);
    switch (deploymentId) {
        case 1:
            let payloadToSave = [...payload];
            payloadToSave.push(rssi);
            // get lat lon
            let nodeLat = getNextDeg(payload);
            let nodeLon = getNextDeg(payload);

            let [init_lat, init_lon] = await getLatLon(deploymentId, deviceId);
            if (init_lat == init_lon && init_lon == -1) {
                console.error(`Cannot find device (${deploymentId},${deviceId})`);
                break;
            }

            let diffMts = getLatLonDiff(nodeLat, nodeLon, init_lat, init_lon);
            if (diffMts > 10) {
                console.log(`Alert on node (${deploymentId},${deviceId}) Diff meters = ${diffMts}`);
                sendAlert(gateway_dep_id, gateway_dev_id, deploymentId, deviceId);
            }

            // update
            sayToNode(deploymentId, deviceId, nodeVBattery, 'alive');
            saveData(gateway_dep_id, gateway_dev_id, deploymentId, deviceId, payloadToSave);

            break;
        case 2:
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
            break;
        default:
            break;
    }
    //TODO: Impr/remove
    console.log(`Battery voltage = ${nodeVBattery}; Data = ${payload}`)
    return true;
}
function getNextDeg(payload: number[]) {
    return parseInt(payload.splice(0, 4).reverse().map(payload => payload.toString(16)).join(''), 16) / 1000000;
}

function getLatLonDiff(lat1: number, lon1: number, lat2: number, lon2: number): number {
    console.log([lat1, lon1, lat2, lon2]);
    var R = 6371e3; // metres
    var φ1 = lat1.toRadians();
    var φ2 = lat2.toRadians();
    var Δφ = (lat2 - lat1).toRadians();
    var Δλ = (lon2 - lon1).toRadians();

    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    var d = R * c;
    console.log(φ1);
    console.log(d);
    return d;
}

async function getLatLon(node_deployment_id: number, node_device_id: number) {
    let query = `query MyQuery5 {
        node(where: {active: {_eq: true}, _and: {deployment_id: {_eq: ${node_deployment_id}}, _and: {device_id: {_eq: ${node_device_id}}}}}){
          location
        }
      }`
    let data = await talkToDB(query);
    if (data) {
        return data['node'][0]['location'].replace(')', '').replace('(', '').split(',').map((x: string) => parseFloat(x))
    } else {
        return [-1, -1];
    }
}

function sendGatewayPacket(gateway_dep_id: number, gateway_dev_id: number, vBattery: number, vSupply: number) {
    console.log([gateway_dep_id, gateway_dev_id, vBattery, vSupply])
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
    let res = await axios(axiosQuery(query))
    return res['data']['data'];
}
