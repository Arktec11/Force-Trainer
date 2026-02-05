import { units } from './state.js';
import { sanitizeValue, formatAbilities } from './helpers.js';
import { displayReviewForm } from './review.js';

export function handleFileUpload(event) {
	const file = event.target.files[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = function (e) {
			try {
				const jsonData = JSON.parse(e.target.result);
				parseData(jsonData);
				unifyUnits();
				displayReviewForm();
			} catch (err) {
				alert("Failed to parse JSON: " + err.message);
			}
		};
		reader.readAsText(file);
	}
}

export function gatherUnitProfiles(sel) {
	let unitProfiles = [];

	if (sel.profiles && Array.isArray(sel.profiles)) {
		unitProfiles.push(...sel.profiles
			.filter(p => p.typeName === "Unit" || p.typeName === "Model")
			.map(profile => {
				const characteristics = {};

				if (profile.characteristics) {
					profile.characteristics.forEach(c => {
						const nm = c.name;
						let val = c.$text;
						characteristics[nm] = val;
					});
				}

				if (characteristics["M"]) {
					characteristics["M"] = sanitizeValue("M", characteristics["M"]);
				}
				if (characteristics["SV"]) {
					characteristics["SV"] = sanitizeValue("SV", characteristics["SV"]);
				}
				if (characteristics["LD"]) {
					characteristics["LD"] = sanitizeValue("LD", characteristics["LD"]);
				}

				return {
					name: profile.name || "Unnamed Unit",
					characteristics
				};
			})
		);
	}

	if (sel.selections && Array.isArray(sel.selections)) {
		sel.selections.forEach(s => {
			unitProfiles.push(...gatherUnitProfiles(s));
		});
	}

	return unitProfiles;
}

export function gatherUnitWeapons(sel) {
	let weapons = [];
	if (sel.profiles) {
		weapons.push(...sel.profiles
			.filter(p => p.typeName === "Ranged Weapons" || p.typeName === "Melee Weapons")
			.map(profile => {
				let isMelee = (profile.typeName === "Melee Weapons");
				let bsVal = "";
				let wsVal = "";
				const characteristics = {};

				profile.characteristics.forEach(c => {
					const nm = c.name;
					let val = c.$text;
					if (nm === "BS") { bsVal = val; } else if (nm === "WS") { wsVal = val; } else {
						characteristics[nm] = val;
					}
				});

				if (isMelee) {
					characteristics["BS/WS"] = wsVal;
				} else {
					characteristics["BS/WS"] = bsVal;
				}

				characteristics["BS/WS"] = sanitizeValue("BS/WS", characteristics["BS/WS"]);

				if (characteristics["Range"]) {
					characteristics["Range"] = sanitizeValue("Range", characteristics["Range"]);
				}
				if (characteristics["AP"]) {
					characteristics["AP"] = sanitizeValue("AP", characteristics["AP"]);
				}
				if (characteristics["Keywords"]) {
					characteristics["Keywords"] = sanitizeValue("Keywords", characteristics["Keywords"]);
					characteristics["Keywords"] = characteristics["Keywords"]
						.split(",")
						.map(s => s.trim())
						.filter(s => s.length > 0)
						.sort((a, b) => a.localeCompare(b));
				}

				return {
					name: profile.name || "Unnamed Weapon",
					characteristics
				};
			})
		);
	}

	if (sel.selections) {
		sel.selections.forEach(s => {
			weapons.push(...gatherUnitWeapons(s));
		});
	}
	return weapons;
}

export function gatherUnitAbilities(sel) {
	let unitAbilities = [];
	if (!sel.profiles) return unitAbilities;

	sel.profiles
		.filter(p => (p.typeName === "Abilities" && p.name !== "Leader" && p.name !== "Attached Unit"))
		.forEach(parent => {
			let aName = parent.name;
			if (/invulnerable save/i.test(aName)) {
				aName = "Invulnerable Save";
			} else if (/damaged/i.test(aName)) {
				aName = "Damaged";
			}

			const ability = {
				name: aName,
				description: parent.characteristics?.map(c => formatAbilities(c.$text)) || "",
				subAbilities: []
			};

			const children = sel.profiles.filter(p => p.typeName === parent.name);

			children.forEach(child => {
				const childDesc = child.characteristics?.map(c => formatAbilities(c.$text)) || "";
				ability.subAbilities.push({
					name: child.name || "Unnamed Sub-Ability",
					description: childDesc
				});

				if (childDesc) {
					ability.description += `\n• ${childDesc}`;
				}
			});

			unitAbilities.push(ability);
		});

	return unitAbilities;
}

export function parseForce(force) {
	let result = [];
	if (force.selections) {
		force.selections.forEach(sel => {
			collectTopLevelUnits(sel, result);
		});
	}

	return result;
}

export function collectTopLevelUnits(sel, arr, ancestorIsUnit = false) {
	if ((sel.type === "unit" || sel.type === "model") && !ancestorIsUnit) {
		const nm = sel.name || "Unnamed Unit";
		const unitWeapons = gatherUnitWeapons(sel);
		const unitProfiles = gatherUnitProfiles(sel);
		const unitAbilities = gatherUnitAbilities(sel);

		arr.push({
			name: nm,
			weapons: unitWeapons,
			profiles: unitProfiles.length > 0 && unitProfiles[0].characteristics ? unitProfiles[0].characteristics : {},
			abilities: unitAbilities
		});
	}

	let nextAncestorIsUnit = ancestorIsUnit || (sel.type === "unit");
	if (sel.selections) {
		sel.selections.forEach(s => {
			collectTopLevelUnits(s, arr, nextAncestorIsUnit);
		});
	}
}

export function parseData(data) {
	if (!data.roster || !Array.isArray(data.roster.forces)) {
		alert("Invalid JSON structure: Missing roster or forces array.");
		return;
	}
	units.splice(0, units.length);
	data.roster.forces.forEach(force => {
		const theseUnits = parseForce(force);
		units.push(...theseUnits);
	});
}

export function unifyUnits() {
	let nameMap = {};
	units.forEach(u => {
		if (!nameMap[u.name]) {
			nameMap[u.name] = { name: u.name, weapons: [], profiles: u.profiles || {}, abilities: [] };
		}
		nameMap[u.name].weapons.push(...u.weapons);
		nameMap[u.name].abilities.push(...u.abilities);
	});

	for (let nm in nameMap) {
		let uniqw = [];
		let uniqa = [];
		let wset = new Set();
		let aset = new Set();
		nameMap[nm].weapons.forEach(w => {
			if (!wset.has(w.name)) {
				wset.add(w.name);
				uniqw.push(w);
			}
		});
		nameMap[nm].abilities.forEach(a => {
			if (!aset.has(a.name)) {
				aset.add(a.name);
				uniqa.push(a);
			}
		});
		nameMap[nm].weapons = uniqw;
		nameMap[nm].abilities = uniqa;
	}

	// Replace contents of the units array in place
	const newUnits = Object.values(nameMap);
	units.splice(0, units.length, ...newUnits);
}
