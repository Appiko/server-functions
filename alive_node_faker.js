const axios = require('axios');
const query = { query: `{node {id}}` };
function axiosQuery(query) {
	return {
		method: 'POST',
		url: process.env.GQLENDPOINT,
		data: query,
		headers: {
			'x-hasura-admin-secret': process.env.HASURASECRET,
		},
	}
};

axios(axiosQuery(query)).then((res) => {
	let x = (res.data.data.node[getRandomInt(res.data.data.node.length)].id)
	let q = {

		query: `mutation say_alive{        insert_alive_node(objects: {node_id: "${x}"}) {          affected_rows        }      }      `
	}
	console.log(q);
	axios(axiosQuery(q)).then((res) => console.log(res.data.data))
})
	.catch((err) => console.error(err));

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

