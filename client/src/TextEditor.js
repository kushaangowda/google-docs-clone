import React, { useCallback, useEffect, useState } from "react";
import "quill/dist/quill.snow.css";
import Quill from "quill";
import "./style.css";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const saveIntervalMs = 2000;
const toolBarOptions = [
	[{ header: [1, 2, 3, 4, 5, 6, false] }],
	[{ font: [] }],
	[{ list: "ordered" }, { list: "bullet" }],
	["bold", "italic", "underline"],
	[{ color: [] }, { background: [] }],
	[{ script: "sub" }, { script: "super" }],
	[{ align: [] }],
	["image", "blockquote", "code-block"],
	["clean"],
];

export const TextEditor = () => {
	const { id: documentId } = useParams();
	const [socket, setSocket] = useState();
	const [quill, setQuill] = useState();
	console.log(documentId);

	// save document
	useEffect(() => {
		if (socket == null || quill == null) return;

		const interval = setInterval(() => {
			socket.emit("save-document", quill.getContents());
		}, saveIntervalMs);

		return () => {
			clearInterval(interval);
		};
	}, [socket, quill]);

	// get and load document
	useEffect(() => {
		if (socket == null || quill == null) return;

		socket.once("load-document", (document) => {
			console.log(document);
			quill.setContents(document);
			quill.enable();
		});

		socket.emit("get-document", documentId);
	}, [socket, quill, documentId]);

	// send changes
	useEffect(() => {
		if (socket == null || quill == null) return;
		const handler = (delta, oldDelta, source) => {
			if (source !== "user") return;
			socket.emit("send-changes", delta);
		};

		quill.on("text-change", handler);

		return () => {
			quill.off("text-change", handler);
		};
	}, [socket, quill]);

	// receive changes
	useEffect(() => {
		if (socket == null || quill == null) return;
		const handler = (delta) => {
			quill.updateContents(delta);
		};

		socket.on("receive-changes", handler);

		return () => {
			quill.off("receive-changes", handler);
		};
	}, [socket, quill]);

	// create socket connection
	useEffect(() => {
		const s = io("http://localhost:5000");
		setSocket(s);

		return () => {
			s.disconnect();
		};
	}, []);

	const wrapperRef = useCallback((wrapper) => {
		if (wrapper == null) return;
		wrapper.innerHTML = "";
		const editor = document.createElement("div");
		wrapper.append(editor);
		const q = new Quill(editor, { theme: "snow", modules: { toolbar: toolBarOptions } });
		q.setText("Loading...");
		q.disable();
		setQuill(q);
	}, []);

	return <div className="container" ref={wrapperRef}></div>;
};
