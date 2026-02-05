import { units, setPageState } from './state.js';
import { sanitizeValue, autoSizeAllTextareas } from './helpers.js';
import { startFlashcards } from './flashcards.js';

export function displayReviewForm() {
	// SET UP REVIEW PAGE
	setPageState("review");
	document.getElementById("flashcard-section").style.display = "none";
	const rev = document.getElementById("review-section");
	rev.style.display = "block";
	rev.innerHTML = "";

	// SET UP TOP ACCEPT BUTTON
	const topButton = document.createElement("button");
	topButton.textContent = "Accept and Start Flashcards";
	topButton.onclick = startFlashcards;
	rev.appendChild(topButton);


	//SET UP UNIT TABLE
	const unitTable = document.createElement("div");
	unitTable.className = "unit-table";

	let unitCharacteristicsSet = new Set();
	units.forEach(u => {
		if (u.profiles && typeof u.profiles === "object") {
			Object.keys(u.profiles).forEach(k => unitCharacteristicsSet.add(k));
		}
	});

	let unitCharacteristics = Array.from(unitCharacteristicsSet);
	const desiredOrder = ["M", "SV", "T", "W", "LD", "OC"];

	unitCharacteristics.sort((a, b) => {
		const ai = desiredOrder.indexOf(a);
		const bi = desiredOrder.indexOf(b);
		return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
	});

	function unitColWidth(k) {
		if (["M", "SV", "T", "W", "LD", "OC", "Weapons", "Abilities"].includes(k)) {
			return "minmax(30px, 80px)";
		}
		return "minmax(60px, 1fr)";
	}

	let unitColDefs = [{ name: "Unit", width: "150px" }];
	unitCharacteristics.forEach(k => {
		unitColDefs.push({ name: k, width: unitColWidth(k) });
	});


	const unitHeadRow = document.createElement("div");
	unitHeadRow.className = "uheader-row";
	unitHeadRow.style.gridTemplateColumns = unitColDefs.map(d => d.width).join(" ");

	const unitHdr = document.createElement("div");
	unitHdr.className = "header-cell";
	unitHdr.textContent = "Unit";
	unitHeadRow.appendChild(unitHdr);

	unitCharacteristics.forEach(k => {
		const c = document.createElement("div");
		c.className = "header-cell";
		c.textContent = k;
		unitHeadRow.appendChild(c);
	});

	unitTable.appendChild(unitHeadRow);

	units.forEach((unit, uIndex) => {
		const uRow = document.createElement("div");
		uRow.className = "unit-row";
		uRow.style.gridTemplateColumns = unitColDefs.map(d => d.width).join(" ");

		const uNameCell = document.createElement("div");
		uNameCell.className = "cell unit-left";
		uNameCell.textContent = unit.name;
		uRow.appendChild(uNameCell);

		unitCharacteristics.forEach(key => {
			const cCell = document.createElement("div");
			cCell.className = "cell";

			let val = (unit.profiles && unit.profiles[key]) ? unit.profiles[key] : "";

			const inp = document.createElement("input");
			inp.type = "text";
			inp.value = val;
			inp.setAttribute("data-unit-index", String(uIndex));
			inp.setAttribute("data-key", key);
			inp.onchange = updateUnitCharacteristic;

			cCell.appendChild(inp);
			uRow.appendChild(cCell);
		});

		unitTable.appendChild(uRow);
	});

	rev.appendChild(unitTable);

	//WEAPONS AND ABILITIES SECTION
	units.forEach((u, uIndex) => {
		const unitDiv = document.createElement("div");
		const unitHeading = document.createElement("h3");
		unitHeading.textContent = u.name;
		unitDiv.appendChild(unitHeading);

		const allKeysSet = new Set();
		u.weapons.forEach(w => {
			Object.keys(w.characteristics).forEach(k => allKeysSet.add(k));
		});

		let allKeys = Array.from(allKeysSet);
		const desired = ["Range", "BS/WS", "A", "S", "AP", "D", "Keywords"];
		allKeys.sort((a, b) => {
			const ai = desired.indexOf(a);
			const bi = desired.indexOf(b);
			return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
		});

		// WEAPONS
		const weaponTable = document.createElement("div");
		weaponTable.className = "weapon-table";

		function weaponColWidth(nm, isWeapon) {
			if (isWeapon) {
				return "150px";
			}
			if (nm === "Keywords") {
				return "minmax(80px, 1fr)";
			}
			if (["Range", "BS/WS", "A", "S", "AP", "D"].includes(nm)) {
				return "minmax(50px, 80px)";
			}
			return "minmax(60px, 1fr)";
		}

		let colDefs = [];
		colDefs.push({ name: "Weapon", width: weaponColWidth("", true) });
		allKeys.forEach(k => {
			colDefs.push({ name: k, width: weaponColWidth(k, false) });
		});

		// WEAPON HEADER ROW
		const weaponHeadRow = document.createElement("div");
		weaponHeadRow.className = "wheader-row";
		weaponHeadRow.style.gridTemplateColumns = colDefs.map(d => d.width).join(" ");

		const weaponHdr = document.createElement("div");
		weaponHdr.className = "header-cell";
		weaponHdr.textContent = "Weapon";
		weaponHeadRow.appendChild(weaponHdr);

		allKeys.forEach(k => {
			const c = document.createElement("div");
			c.className = "header-cell";
			c.textContent = k;
			weaponHeadRow.appendChild(c);
		});
		weaponTable.appendChild(weaponHeadRow);

		u.weapons.forEach((weapon, wIx) => {
			// create row for weapon
			const wRow = document.createElement("div");
			wRow.className = "weapon-row";
			wRow.style.gridTemplateColumns = colDefs.map(d => d.width).join(" ");

			// create cell for weapon name
			const wNameCell = document.createElement("div");
			wNameCell.className = "cell weapon-left";
			wNameCell.textContent = weapon.name;
			wRow.appendChild(wNameCell);

			allKeys.forEach(key => {
				const cCell = document.createElement("div");
				cCell.className = "cell";

				let val = weapon.characteristics[key] || "";
				if (key === "Keywords" && val === "-") {
					val = "";
				}

				if (key === "Keywords") {
					const correctTags = weapon.characteristics["Keywords"] || [];
					const container = document.createElement("div");
					container.className = "keyword-container";
					container.setAttribute("data-weapon-index", wIx);
					container.setAttribute("data-key", "Keywords");

					const tagsDiv = document.createElement("div");
					tagsDiv.className = "tags";

					correctTags.forEach(kw => {
						const tag = document.createElement("span");
						tag.className = "tag";
						tag.textContent = kw;
						tagsDiv.appendChild(tag);
					});

					container.appendChild(tagsDiv);
					cCell.appendChild(container);
				} else {
					const inp = document.createElement("input");
					inp.type = "text";
					inp.value = val;
					inp.setAttribute("data-unit-index", String(uIndex));
					inp.setAttribute("data-weapon-index", String(wIx));
					inp.setAttribute("data-key", key);
					inp.onchange = updateWeaponCharacteristic;

					if (key === "Range" && val.toLowerCase() === "melee") {
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

		unitDiv.appendChild(weaponTable);


		// ABILITIES
		const atbl = document.createElement("div");
		atbl.className = "ability-table";

		const aHeadRow = document.createElement("div");
		aHeadRow.className = "aheader-row header-cell";
		aHeadRow.textContent = "Abilities";
		aHeadRow.style.gridTemplateColumns = "150px 1fr";
		atbl.appendChild(aHeadRow);

		u.abilities.forEach((ability, aIx) => {
			const aRow = document.createElement("div");
			aRow.className = "ability-row";
			aRow.style.gridTemplateColumns = "150px 1fr";

			const aNameCell = document.createElement("div");
			aNameCell.className = "cell ability-left";
			aNameCell.textContent = ability.name;
			aRow.appendChild(aNameCell);

			const aCell = document.createElement("div");
			aCell.className = "cell";

			const inp = document.createElement("textarea");
			inp.value = ability.description;
			inp.setAttribute("data-unit-index", String(uIndex));
			inp.setAttribute("data-ability-index", String(aIx));
			inp.onchange = updateAbilities;
			aCell.appendChild(inp);
			aRow.appendChild(aCell);

			atbl.appendChild(aRow);

			inp.style.height = "auto";
			inp.style.height = inp.scrollHeight + "px";
		});

		unitDiv.appendChild(atbl);

		rev.appendChild(unitDiv);
		autoSizeAllTextareas();
	});


	document.getElementById("accept-button").style.display = "block";
}

function updateUnitCharacteristic(ev) {
	const uIndex = ev.target.getAttribute("data-unit-index");
	const key = ev.target.getAttribute("data-key");
	const val = ev.target.value;

	if (!units[uIndex].profiles) {
		units[uIndex].profiles = {};
	}

	units[uIndex].profiles[key] = sanitizeValue(key, val);
}

function updateWeaponCharacteristic(ev) {
	const uIndex = ev.target.getAttribute("data-unit-index");
	const wIndex = ev.target.getAttribute("data-weapon-index");
	const key = ev.target.getAttribute("data-key");
	const val = ev.target.value;
	if (key === "Range" && val.toLowerCase() === "melee") {
		return;
	}
	units[uIndex].weapons[wIndex].characteristics[key] = sanitizeValue(key, val);
}

function updateAbilities(ev) {
	const uIndex = ev.target.getAttribute("data-unit-index");
	const aIndex = ev.target.getAttribute("data-ability-index");
	const val = ev.target.value;
	units[uIndex].abilities[aIndex].description = val;
}
