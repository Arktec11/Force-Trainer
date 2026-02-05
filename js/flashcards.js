import {
	units, incorrectBucket, correctBucket, deferredBucket,
	currentIndex, answersRevealed, knownWeapons, testSettings, justSubmitted,
	setIncorrectBucket, setCorrectBucket, setDeferredBucket,
	setCurrentIndex, setAnswersRevealed, setKnownWeapons, setPageState,
	setJustSubmitted
} from './state.js';
import { sanitizeValue, shuffleArray, autoSizeAllTextareas } from './helpers.js';
import { keywordSuggestions, setupKeywordInput, getUserKeywords } from './keywords.js';
import { displayReviewForm } from './review.js';

export function startFlashcards() {
	document.getElementById("review-section").style.display = "none";
	document.getElementById("accept-button").style.display = "none";
	document.getElementById("flashcard-section").style.display = "block";

	setPageState("flashcards");
	const newBucket = [...units]
		.filter(u => !testSettings.excludedUnits.has(u.name))
		.map(u => ({
			...u,
			weapons: u.weapons.filter(w => !testSettings.excludedWeapons.has(w.name)),
			profiles: Object.fromEntries(
				Object.entries(u.profiles).filter(([k]) => !testSettings.excludedColumns.has(k))
			),
			abilities: u.abilities
		}));
	shuffleArray(newBucket);
	setIncorrectBucket(newBucket);
	setCorrectBucket([]);
	setDeferredBucket([]);
	setCurrentIndex(0);
	setAnswersRevealed(false);
	setKnownWeapons({});

	updateProgress();
	displayFlashcard();
}

export function updateProgress() {
	const flashContainer = document.getElementById("flashcard");
	const prog = flashContainer.querySelector("#progress");
	if (!prog) return;
	const inc = incorrectBucket.length;
	const cor = correctBucket.length;
	const def = deferredBucket.length;
	prog.textContent = `   Remaining: ${inc}   Correct: ${cor}   Incorrect: ${def}`;
}

export function displayFlashcard() {
	const flashContainer = document.getElementById("flashcard");
	flashContainer.innerHTML = "";

	if (currentIndex >= incorrectBucket.length) {
		setCurrentIndex(0);
	}

	const unit = incorrectBucket[currentIndex];

	// SET UP BUTTONS
	const btnDiv = document.createElement("div");

	const submitBtn = document.createElement("button");
	submitBtn.id = "submitBtn";
	submitBtn.textContent = "Submit Answers (Enter)";
	submitBtn.addEventListener("click", submitAnswers);
	btnDiv.appendChild(submitBtn);

	const revealBtn = document.createElement("button");
	revealBtn.id = "revealBtn";
	revealBtn.textContent = "Reveal Answers (Shift+Enter)";
	revealBtn.addEventListener("click", revealAnswers);
	btnDiv.appendChild(revealBtn);

	const correctBtn = document.createElement("button");
	correctBtn.id = "correctBtn";
	correctBtn.textContent = "Correct (Enter)";
	correctBtn.addEventListener("click", markCardCorrect);
	correctBtn.className = "hidden";
	btnDiv.appendChild(correctBtn);

	const incorrectBtn = document.createElement("button");
	incorrectBtn.id = "incorrectBtn";
	incorrectBtn.textContent = "Incorrect (Shift+Enter)";
	incorrectBtn.addEventListener("click", markCardIncorrect);
	incorrectBtn.className = "hidden";
	btnDiv.appendChild(incorrectBtn);

	const restartBtn = document.createElement("button");
	restartBtn.id = "restartBtn";
	restartBtn.textContent = "Restart";
	restartBtn.addEventListener("click", startFlashcards);
	btnDiv.appendChild(restartBtn);

	const backBtn = document.createElement("button");
	backBtn.id = "backBtn";
	backBtn.textContent = "Back to Editing";
	backBtn.addEventListener("click", backToEditing);
	btnDiv.appendChild(backBtn);

	if (incorrectBucket.length === 0 && deferredBucket.length === 0) {
		const completeText = document.createElement("h3");
		completeText.textContent = "All flashcards completed! You have no more incomplete cards.";
		flashContainer.appendChild(completeText);
		flashContainer.appendChild(restartBtn);
		flashContainer.appendChild(backBtn);
		setPageState("complete");
		updateProgress();
		return;
	}


	// UNIT TABLE
	let unitCharKeys = Object.keys(unit.profiles || {});
	const desiredProfileOrder = ["M", "SV", "T", "W", "LD", "OC"];

	unitCharKeys.sort((a, b) => {
		const ai = desiredProfileOrder.indexOf(a);
		const bi = desiredProfileOrder.indexOf(b);
		return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
	});

	let gridColumnDefinition = `150px ${unitCharKeys.map(k => 'minmax(50px, 80px)').join(' ')}`;

	const unitTable = document.createElement("div");
	unitTable.className = "unit-table";

	const unitHeadRow = document.createElement("div");
	unitHeadRow.className = "uheader-row";
	unitHeadRow.style.gridTemplateColumns = gridColumnDefinition;

	const unitHdr = document.createElement("div");
	unitHdr.className = "header-cell";
	unitHdr.textContent = "Unit";
	unitHeadRow.appendChild(unitHdr);

	unitCharKeys.forEach(k => {
		const c = document.createElement("div");
		c.className = "header-cell";
		c.textContent = k;
		unitHeadRow.appendChild(c);
	});

	unitTable.appendChild(unitHeadRow);

	const unitRow = document.createElement("div");
	unitRow.className = "unit-row";
	unitRow.style.gridTemplateColumns = gridColumnDefinition;

	const unitNameCell = document.createElement("div");
	unitNameCell.className = "cell unit-left";
	unitNameCell.textContent = unit.name;
	unitRow.appendChild(unitNameCell);

	unitCharKeys.forEach(k => {
		const uCell = document.createElement("div");
		uCell.className = "cell";

		let cVal = unit.profiles[k] || "";
		let dis = false;
		let showVal = answersRevealed ? cVal : "";

		const inp = document.createElement("input");
		inp.type = "text";
		inp.value = showVal;
		inp.disabled = dis;
		inp.setAttribute("data-Unit-index", String(currentIndex));
		inp.setAttribute("data-correct", cVal);
		inp.setAttribute("data-key", k);

		uCell.appendChild(inp);
		unitRow.appendChild(uCell);
	});

	unitTable.appendChild(unitRow);


	//WEAPON TABLE

	if (!document.getElementById("keyword-options")) {
		const datalist = document.createElement("datalist");
		datalist.id = "keyword-options";

		keywordSuggestions.forEach(kw => {
			const option = document.createElement("option");
			option.value = kw;
			datalist.appendChild(option);
		});
		document.body.appendChild(datalist);
	}

	let keySet = new Set();
	unit.weapons.forEach(w => {
		Object.keys(w.characteristics).forEach(k => keySet.add(k));
	});

	let allKeys = Array.from(keySet);
	const desired = ["Range", "BS/WS", "A", "S", "AP", "D", "Keywords"];
	allKeys.sort((a, b) => {
		const ai = desired.indexOf(a);
		const bi = desired.indexOf(b);
		if (ai === -1 && bi === -1) {
			return a.localeCompare(b);
		} else if (ai === -1) {
			return 1;
		} else if (bi === -1) {
			return -1;
		} else {
			return ai - bi;
		}
	});

	let colDefs = [];
	colDefs.push({ name: "Weapon", width: "150px" });

	function colWidth(k) {
		if (k === "Keywords") {
			return "1fr";
		} else if (["Range", "BS/WS", "A", "S", "AP", "D"].includes(k)) {
			return "minmax(50px,80px)";
		} else {
			return "minmax(60px,1fr)";
		}
	}

	allKeys.forEach(k => {
		colDefs.push({ name: k, width: colWidth(k) });
	});

	const colStr = colDefs.map(d => d.width).join(" ");

	const weaponTable = document.createElement("div");
	weaponTable.className = "weapon-table";

	// WEAPON HEADER ROW
	const weaponHeadRow = document.createElement("div");
	weaponHeadRow.className = "wheader-row";
	weaponHeadRow.style.gridTemplateColumns = colStr;

	const weaponHdr = document.createElement("div");
	weaponHdr.className = "header-cell";
	weaponHdr.textContent = "Weapon";
	weaponHeadRow.appendChild(weaponHdr);

	allKeys.forEach(k => {
		const c = document.createElement("div");
		c.className = "header-cell";
		c.textContent = k;
		if (k === "Keywords") c.style.textAlign = "left";
		weaponHeadRow.appendChild(c);
	});
	weaponTable.appendChild(weaponHeadRow);

	let ranged = [];
	let melee = [];
	unit.weapons.forEach(w => {
		let rg = w.characteristics.Range || "";
		if (rg.toLowerCase() === "melee") {
			melee.push(w);
		} else {
			ranged.push(w);
		}
	});

	let orderedWeapons = [...ranged, ...melee];

	unit.weapons = orderedWeapons;

	// WEAPON ROWS
	orderedWeapons.forEach((weapon, wIx) => {
		const wRow = document.createElement("div");
		wRow.className = "weapon-row";
		wRow.style.gridTemplateColumns = colStr;

		const wNameCell = document.createElement("div");
		wNameCell.className = "cell weapon-left";
		wNameCell.textContent = weapon.name;
		wRow.appendChild(wNameCell);

		allKeys.forEach(k => {
			const cCell = document.createElement("div");
			cCell.className = "cell ";

			let cVal = weapon.characteristics[k] || "";
			let dis = false;

			if (k === "Range" && cVal.toLowerCase() === "melee") {
				dis = "disabled";
			}

			let showVal = answersRevealed ? cVal : "";
			if (knownWeapons[weapon.name]) {
				if (cVal === knownWeapons[weapon.name][k] && k !== "BS/WS") {
					showVal = cVal || "";
					dis = true;
				}
			}

			if (k === "Keywords") {
				cCell.className = "keyword-cell";

				const correctTags = weapon.characteristics["Keywords"] || [];
				const container = document.createElement("div");
				container.className = "keyword-container";
				container.setAttribute("data-weapon-index", wIx);
				container.setAttribute("data-key", k);

				const tagsDiv = document.createElement("div");
				tagsDiv.className = "tags";

				correctTags.forEach(kw => {
					const tag = document.createElement("span");
					tag.className = "tag hidden";
					tag.textContent = kw;
					tagsDiv.appendChild(tag);
				});

				container.appendChild(tagsDiv);
				setupKeywordInput(container);

				cCell.appendChild(container);
			} else {
				const inp = document.createElement("input");
				inp.type = "text";
				inp.value = showVal;
				inp.disabled = dis;
				inp.setAttribute("data-weapon-index", String(wIx));
				inp.setAttribute("data-correct", cVal);
				inp.setAttribute("data-key", k);

				if (k === "Range" && cVal.toLowerCase() === "melee") {
					inp.value = "Melee";
					inp.disabled = true;
					inp.classList.add("grayed");
				}

				cCell.appendChild(inp);
			}

			wRow.appendChild(cCell);
		});

		weaponTable.appendChild(wRow);
	});


	// ABILITY TABLE

	let abilityTable = document.createElement("div");
	abilityTable.className = "ability-table";
	abilityTable.style.display = "grid";

	let aHeadRow = document.createElement("div");
	aHeadRow.className = "aheader-row header-cell";
	aHeadRow.style.align = "left";
	aHeadRow.textContent = "Abilities";
	aHeadRow.style.gridTemplateColumns = "150px 1fr 1fr";

	abilityTable.appendChild(aHeadRow);

	unit.abilities.forEach((ability, aIx) => {
		let aVal = ability.description || "";
		let showVal = answersRevealed ? aVal : "Hidden";

		const aRow = document.createElement("div");
		aRow.className = "ability-row";
		aRow.style.gridTemplateColumns = "150px 1fr 1fr";

		const cell1 = document.createElement("div");
		cell1.className = "cell ability-left";
		cell1.textContent = ability.name || "";
		aRow.appendChild(cell1);

		const cell2 = document.createElement("div");
		cell2.className = "cell";
		let taInput = document.createElement("textarea");
		cell2.appendChild(taInput);
		aRow.appendChild(cell2);

		const cell3 = document.createElement("div");
		cell3.className = "cell";
		let taOutput = document.createElement("textarea");
		taOutput.setAttribute("data-ability-index", aIx);
		taOutput.setAttribute("data-correct", aVal);
		taOutput.disabled = true;
		taOutput.value = showVal;
		cell3.appendChild(taOutput);
		aRow.appendChild(cell3);

		abilityTable.appendChild(aRow);
	});


	// SET UP PAGE
	let prog = document.createElement("div");
	prog.id = "progress";
	flashContainer.appendChild(prog);

	let h3 = document.createElement("h3");
	h3.textContent = unit.name;
	flashContainer.appendChild(h3);

	flashContainer.appendChild(unitTable);
	flashContainer.appendChild(weaponTable);
	flashContainer.appendChild(abilityTable);
	flashContainer.appendChild(btnDiv);


	updateProgress();
	flashContainer.querySelectorAll("input")[0].focus();
	autoSizeAllTextareas();
}

export function submitAnswers() {
	setJustSubmitted(true);
	setTimeout(() => setJustSubmitted(false), 200);

	const flashContainer = document.getElementById("flashcard");
	if (!flashContainer) return;

	const unit = incorrectBucket[currentIndex];
	let allCorrect = true;

	const inputs = flashContainer.querySelectorAll("input");
	let firstWrong = null;

	inputs.forEach(inp => {
		if (!inp) return;
		const key = inp.getAttribute("data-key");

		if (key === "Keywords") {
			const container = inp.closest(".keyword-container");
			if (!container) return;

			const wIx = container.getAttribute("data-weapon-index");

			const correctTags = (unit.weapons[wIx].characteristics["Keywords"] || [])
				.map(t => t.trim().toLowerCase());
			const userTags = getUserKeywords(container)
				.map(t => t.trim().toLowerCase());
			const correctSet = new Set(correctTags);

			const bothEmpty = correctTags.length === 0 && userTags.length === 0;

			userTags.forEach(userTag => {
				const tagEl = Array.from(container.querySelectorAll(".tag"))
					.find(t => t.textContent.trim().toLowerCase() === userTag);

				if (!tagEl) return;

				if (correctSet.has(userTag)) {
					tagEl.classList.add("correct");
					tagEl.onclick = null;
					tagEl.dataset.locked = "true";
				} else {
					tagEl.classList.add("incorrect");
				}
			});

			const kwCorrect =
				bothEmpty ||
				(userTags.length === correctTags.length &&
					userTags.every(t => correctSet.has(t)));


			inp.style.border = kwCorrect ? "3px solid green" : "3px solid red";
			inp.disabled = kwCorrect;
			if (!kwCorrect) allCorrect = false;

			return;
		}

		const correctVal = (inp.getAttribute("data-correct") || "").trim().toLowerCase();
		const userVal = sanitizeValue(key, inp.value);

		if (key === "Range" && correctVal === "melee") {
			return;
		}

		if (correctVal.toLowerCase() !== userVal.toLowerCase()) {
			inp.style.border = "3px solid red";
			allCorrect = false;
			if (!firstWrong) firstWrong = inp;
		} else {
			inp.style.border = "3px solid green";
			inp.disabled = true;
		}
	});

	if (allCorrect) {
		revealAnswers();
	} else {
		if (firstWrong) firstWrong.focus();
	}

	if (incorrectBucket.length === 0 && deferredBucket.length > 0) {
		setIncorrectBucket([...deferredBucket]);
		setDeferredBucket([]);
	}

	if (currentIndex >= incorrectBucket.length) {
		setCurrentIndex(0);
	}
	updateProgress();
}

export function revealAnswers() {
	const flashContainer = document.getElementById("flashcard");
	if (!flashContainer) return;

	setAnswersRevealed(true);

	const inputs = flashContainer.querySelectorAll("input");
	inputs.forEach(inp => {
		if (!inp) return;
		const cVal = inp.getAttribute("data-correct") || "";
		if (!inp.disabled) {
			inp.value = cVal;
			inp.disabled = true;
		}
	});

	const textareas = flashContainer.querySelectorAll("textarea");
	textareas.forEach(inp => {
		if (!inp) return;
		const aVal = inp.getAttribute("data-correct") || inp.value;
		inp.value = aVal;
		inp.disabled = true;
	});

	document.querySelectorAll(".tag").forEach(t => {
		t.classList.remove("hidden");
		t.classList.add("revealed");
	});

	const sb = document.getElementById("submitBtn");
	const rb = document.getElementById("revealBtn");
	const cb = document.getElementById("correctBtn");
	const ib = document.getElementById("incorrectBtn");

	if (sb) sb.classList.add("hidden");
	if (rb) rb.classList.add("hidden");
	if (cb) cb.classList.remove("hidden");
	if (ib) ib.classList.remove("hidden");

	autoSizeAllTextareas();
}

export function markCardCorrect() {
	const card = incorrectBucket.splice(currentIndex, 1)[0];
	setAnswersRevealed(false);

	card.weapons.forEach(w => {
		if (!knownWeapons[w.name]) {
			knownWeapons[w.name] = { ...w.characteristics };
		}
	});

	correctBucket.push(card);

	if (incorrectBucket.length === 0 && deferredBucket.length > 0) {
		setIncorrectBucket([...deferredBucket]);
		setDeferredBucket([]);
	}

	if (currentIndex >= incorrectBucket.length) {
		setCurrentIndex(0);
	}

	displayFlashcard();
}

export function markCardIncorrect() {
	const card = incorrectBucket.splice(currentIndex, 1)[0];
	setAnswersRevealed(false);

	deferredBucket.push(card);

	if (incorrectBucket.length === 0 && deferredBucket.length > 0) {
		setIncorrectBucket([...deferredBucket]);
		setDeferredBucket([]);
	}

	if (currentIndex >= incorrectBucket.length) {
		setCurrentIndex(0);
	}

	displayFlashcard();
}

export function backToEditing() {
	document.getElementById("flashcard-section").style.display = "none";
	setPageState("review");
	displayReviewForm();
}
