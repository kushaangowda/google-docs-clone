const mongoose = require("mongoose");
const Document = require("./models/document.model");
require("dotenv").config();

const uri = process.env.ATLAS_URI;

const connect = mongoose.connect(uri, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true,
});

connect.then(
	(db) => {
		console.log("MongoDB connected");
	},
	(err) => {
		console.log(err);
	}
);

const io = require("socket.io")(5000, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
	},
});

const defaultValue = "";

// run everytime client connects
io.on("connection", (socket) => {
	socket.on("get-document", async (documentId) => {
		const data = await findOrCreateDocument(documentId);
		socket.join(documentId);
		socket.emit("load-document", data.data);
		socket.on("send-changes", (delta) => {
			console.log("sending changes");
			socket.broadcast.to(documentId).emit("receive-changes", delta);
		});
		socket.on("save-document", async (data) => {
			// console.log("Saving document");
			await Document.findByIdAndUpdate(documentId, { data });
		});
	});
	console.log("Connected");
});

async function findOrCreateDocument(id) {
	if (id == null) return;
	const document = await Document.findById(id);
	if (document) {
		console.log("Document Found");
		return document;
	}
	return await Document.create({ _id: id, data: defaultValue });
}
