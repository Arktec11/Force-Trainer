export const keywordSuggestions = [
	"Assault",
	"Heavy",
	"Twin-Linked",
	"Lethal Hits",
	"Blast",
	"Pistol",
	"Devastating Wounds",
	"Precision",
	"Hazardous",
	"Torrent",
	"Ignores Cover",
	"Psychic",
	"Lance",
	"Indirect Fire",
	"Extra Attacks",
	"Conversion",
	"One Shot",
];

export const keywordsWithSuffix = [
	"Melta",
	"Rapid Fire",
	"Sustained Hits",
	"Anti-Beast",
	"Anti-Infantry",
	"Anti-Monster",
	"Anti-Vehicle",
	"Anti-Titanic",
	"Anti-Fly",
	"Anti-Character",
	"Anti-Psychic",
];

keywordSuggestions.push(...keywordsWithSuffix.map(x => x + " [X]"));

export function setupKeywordInput(container) {
	let tagsDiv = container.querySelector(".tags");
	if (!tagsDiv) {
		tagsDiv = document.createElement("div");
		tagsDiv.className = "tags";
	}

	// Create datalist
	const datalist = document.createElement("datalist");
	const listId = "keyword-options-" + Math.random().toString(36).substring(2, 8);
	datalist.id = listId;
	document.body.appendChild(datalist);

	const input = document.createElement("input");
	input.className = "keyword-input";
	input.setAttribute("data-key", "Keywords");

	input.addEventListener("input", () => {
		const val = input.value.trim();
		if (val.length > 0) {
			input.setAttribute("list", listId);
		} else {
			input.removeAttribute("list");
		}

		const matches = keywordSuggestions.filter(
			kw => kw.toLowerCase().includes(val.toLowerCase())
		);
	});

	container.appendChild(input);
	container.appendChild(tagsDiv);

	// Helper: refresh datalist with remaining suggestions
	function refreshSuggestions() {
		datalist.innerHTML = "";

		const used = new Set(
			[...tagsDiv.querySelectorAll(".tag.revealed")].map(t => t.textContent.toLowerCase())
		);

		const filtered = keywordSuggestions.filter(kw => {
			const kwLower = kw.toLowerCase();
			return !Array.from(used).some(u => u.includes(kwLower) || kwLower.includes(u));
		});

		filtered.forEach(kw => {
			const opt = document.createElement("option");
			opt.value = kw;
			datalist.appendChild(opt);
		});
	}

	// Helper: create tag safely (no duplicates, updates suffix numbers)
	function addTag(value) {
		const trimmed = value.trim();
		if (!trimmed) return;

		// Block keywords that still have [X] placeholder
		if (/\[x\]/i.test(trimmed)) return;

		// Check if this is a suffixed keyword and find existing tag with same base
		const base = keywordsWithSuffix.find(
			kw => trimmed.toLowerCase().startsWith(kw.toLowerCase())
		);

		if (base) {
			const existingTag = [...tagsDiv.querySelectorAll(".tag")]
				.find(t => t.textContent.toLowerCase().startsWith(base.toLowerCase()));

			if (existingTag) {
				// Update the existing tag's number instead of adding a duplicate
				existingTag.textContent = trimmed;
				existingTag.classList.remove("hidden");
				existingTag.classList.add("revealed");
				existingTag.onclick = () => existingTag.remove();
				input.value = "";
				return;
			}
		}

		const tag = [...tagsDiv.querySelectorAll(".tag")]
			.find(t => t.textContent.toLowerCase() === trimmed.toLowerCase());

		if (tag) {
			tag.classList.remove("hidden");
			tag.classList.add("revealed");
			tag.onclick = () => tag.remove();
		} else {
			const wrongTag = document.createElement("span");
			wrongTag.className = "tag revealed";
			wrongTag.textContent = trimmed;
			wrongTag.onclick = () => wrongTag.remove();
			tagsDiv.appendChild(wrongTag);
		}

		input.value = "";
	}

	// Handle typing and confirmation
	input.addEventListener("input", () => {
		const val = input.value.toLowerCase().trim();

		const match = keywordSuggestions.find(
			kw => kw.toLowerCase() === val.toLowerCase()
		);

		// Don't auto-accept suffixed placeholders like "Sustained Hits [X]"
		if (match && !/\[x\]/i.test(match)) addTag(match);
	});

	// Handle Enter / Tab / selection
	input.addEventListener("keydown", e => {
		if (e.key === "Enter" || e.key === "Tab") {
			const val = input.value.trim();

			if (val.length > 0) {
				e.preventDefault();

				const base = keywordsWithSuffix.find(
					kw => val.toLowerCase().startsWith(kw.toLowerCase())
				);

				if (base) {
					if (val.toLowerCase() === base.toLowerCase()) {
						return;
					} else {
						let match = base + val.replace(base.toLowerCase(), "");
						addTag(match);
					}
				}

				const match = keywordSuggestions.find(
					kw => kw.toLowerCase() === val.toLowerCase()
				) || keywordSuggestions.find(kw =>
					kw.toLowerCase().startsWith(val.toLowerCase())
				);

				if (match) addTag(match);
				else input.value = "";
			} else if (e.key === "Enter") {
				input.blur();

				const evt = new KeyboardEvent("keydown", {
					key: "Enter",
					code: "Enter",
					bubbles: true,
				});
				document.dispatchEvent(evt);
			}
		}
	});

	// When a suggestion is chosen from dropdown
	input.addEventListener("change", () => {
		const val = input.value.trim();
		if (!val) return;
		addTag(val);
	});

	refreshSuggestions();
}

export function getUserKeywords(container) {
	let userTags = Array.from(container.querySelectorAll(".tag.revealed"))
		.map(tag => tag.textContent.trim().toLowerCase())
		.filter(t => t.length > 0);

	return userTags;
}
