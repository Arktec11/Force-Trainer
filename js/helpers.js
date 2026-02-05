export function sanitizeValue(k, v) {
	if (k === "Range" && v.toLowerCase() === "melee") {
		return "Melee";
	}
	const arr = ["Range", "AP", "BS/WS", "M", "SV", "LD", "user"];
	if (arr.includes(k)) {
		return v.replace(/[^0-9]/g, "");
	}
	if (k === "Keywords" && v === "-") {
		return "";
	}
	return v;
}

export function autoSizeAllTextareas() {
	document.querySelectorAll("textarea").forEach(ta => {
		ta.style.height = "auto";
		ta.style.height = ta.scrollHeight + "px";
	});
}

export function shuffleArray(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
}

export function formatAbilities(text) {
	return text
		.replace(/\^\^\*\*(.*?)\^\^\*\*/g, (_, inner) => {
			return inner.toUpperCase();
		})
		.replace(/\^\^\*\*(.*?)\*\*\^\^/g, (_, inner) => {
			return inner.toUpperCase();
		})
		.replace(/\*\*\^\^(.*?)\^\^\*\*/g, (_, inner) => {
			return inner.toUpperCase();
		})
		.replace(/\*\*\^\^(.*?)\*\*\^\^/g, (_, inner) => {
			return inner.toUpperCase();
		});
}

export function tokenizeKeywords(str) {
	const cleaned = str.replace(/[^a-z0-9+]+/g, " ").trim();
	if (!cleaned) return new Set();
	return new Set(cleaned.split(/\s+/));
}

export function setsEqual(a, b) {
	if (a.size !== b.size) return false;
	for (const x of a) {
		if (!b.has(x)) return false;
	}
	return true;
}
