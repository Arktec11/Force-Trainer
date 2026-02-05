export let units = [];
export let incorrectBucket = [];
export let correctBucket = [];
export let deferredBucket = [];
export let currentIndex = 0;
export let answersRevealed = false;
export let knownWeapons = {}; // structure: { "Bolt Pistol": { "Range": "12", "A": "1", "S": "4", ... } }
export let pageState = "upload"; // upload, review, flashcards, complete
export let kwFocus = false;
export let justSubmitted = false;

export let testSettings = {
	excludedColumns: new Set(),
	excludedUnits: new Set(),
	excludedWeapons: new Set(),
};

// Setters for primitives (modules bind by reference for objects, but not for primitives)
export function setUnits(val) { units = val; }
export function setIncorrectBucket(val) { incorrectBucket = val; }
export function setCorrectBucket(val) { correctBucket = val; }
export function setDeferredBucket(val) { deferredBucket = val; }
export function setCurrentIndex(val) { currentIndex = val; }
export function setAnswersRevealed(val) { answersRevealed = val; }
export function setKnownWeapons(val) { knownWeapons = val; }
export function setPageState(val) { pageState = val; }
export function setKwFocus(val) { kwFocus = val; }
export function setJustSubmitted(val) { justSubmitted = val; }
