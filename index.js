"use strict";

const tessel = require('tessel');
const infraredlib = require('ir-attx4');
const infrared = infraredlib.use(tessel.port['A']);

const codes = {
	on: require("./codes/on.json"),
	off: require("./codes/off.json")
};

// When we're connected
infrared.on('ready', function() {
	console.log("Connected to IR!");
	infrared.sendRawSignal(38, new Buffer(codes.on), function(err) {
		if (err) {
			console.log("Unable to send signal: ", err);
		} else {
			console.log("Signal sent!");
		}
	});
});

// If we get data, print it out
infrared.on('data', function(data) {
	console.log("Received RX Data:");
	console.log(data.toJSON());
});
