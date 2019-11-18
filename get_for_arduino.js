const APP_NAME = "get_medium"
const PORT = 3200




const app = require('express')()
const bodyParser = require('body-parser')
const helmet = require('helmet')
const axios = require('axios')

app.use(helmet())
app.use(bodyParser.json())

app.listen(PORT, () => {
	console.log(`${APP_NAME} listening on port ${PORT}...`)
})

app.get('/alert', (req, res) => {

	let queryByte = req.query.q;
	console.log(queryByte);
	let node;
	switch (queryByte) {
		case 'A':
		case 'B':
		case 'C':
			node = 'f5:ad:a7:4b:66:bc'
	}

	if (node != undefined) {
		const query = { "query": `mutation MyMutation { insert_alert(objects: {node_id: "${node}", gateway_id: "a1:b2:c0:a1:b0:c0"}) { affected_rows } }` };

		const axiosQuery = {
			method: 'POST',
			url: process.env.GQLENDPOINT,
			data: query,
			headers: {
				'x-hasura-admin-secret': process.env.HASURASECRET,
			},
		};



		axios(axiosQuery)
			.then((x) => { console.log(x['data']); res.status(200).send("DONE"); })
			.catch((e) => { console.log(e); });
	} else {
		res.send(res.status(400).send("No nodes"));
	}

});

