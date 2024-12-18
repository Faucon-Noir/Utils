export function downloadFile(
	item: BlobPart,
	filename: string,
	type: "text" | "csv"
) {
	const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);
	const fileContent = item;
	const blob = new Blob([BOM, fileContent], {
		type: `text/${type === "text" ? "plain" : "csv"};charset=utf-8;`,
	});
	const url: string = window.URL.createObjectURL(blob);
	const link: HTMLAnchorElement = document.createElement("a");
	link.href = url;
	link.setAttribute(
		"download",
		`${filename}.${type === "text" ? "txt" : "csv"}`
	);
	document.body.appendChild(link);
	link.click();
	link.remove();
}
