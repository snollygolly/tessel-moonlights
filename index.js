"use strict";

const http = require("http");
const IP = require('os').networkInterfaces().wlan0[0].address;
const PORT = 8000;

const co = require("co");
const Promise = require("bluebird");
const fs = require("fs");

const tessel = require("tessel");
const infraredlib = require("ir-attx4");
const infrared = Promise.promisifyAll(infraredlib.use(tessel.port["A"]));

let codes = {};
setCodes();

function setCodes() {
	const files = fs.readdirSync(`${__dirname}/codes`);
	for (const file of files) {
		const fileName = file.split(".").shift();
		codes[fileName] = require(`./codes/${file}`);
	}
	console.log(`Set ${files.length} codes`);
}

const server = http.createServer(function (request, response) {
	const codeType = request.url.split("/").pop();
	co(function *(){
		// yield any promise
		console.log(codes[codeType]);
		const result = yield infrared.sendRawSignalAsync(38, new Buffer(codes[codeType]));
		if (result) {
			// there shouldn't be a result, that means there was an error
			throw result;
		}
		response.writeHead(200, {"Content-Type": "text/plain"});
		response.end("OK\n");
	}).catch((err) => {
		console.error(err.stack);
		response.writeHead(500, {"Content-Type": "text/plain"});
		response.end("Error\n");
	});
});

server.listen(PORT);

console.log(`Server running at http://${IP}:${PORT}/`);

// light listeners

// When we"re connected
infrared.on("ready", function() {
	console.log("Connected to IR!");
});

// If we get data, print it out
infrared.on("data", function(data) {
	const now = Date.now();
	const code = data.toJSON().data;
	console.log(`Received RX Data: ${data.toString("hex").length}`);
	console.log(code);
	if (code.length < 10) {
		// not sure what this is, I don't want it though
		console.log("Discarding...");
		return;
	}
	fs.writeFileSync(`${__dirname}/codes/${now}.json`, JSON.stringify(code));
	console.log(`Wrote file as ${now}.json`);
	setCodes();
});
