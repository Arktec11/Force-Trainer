import { pageState, answersRevealed, justSubmitted } from './state.js';
import { handleFileUpload } from './upload.js';
import { startFlashcards, submitAnswers, revealAnswers, markCardCorrect, markCardIncorrect, backToEditing } from './flashcards.js';

// Expose handleFileUpload globally for the inline onchange handler
window.handleFileUpload = handleFileUpload;

// Expose startFlashcards globally for the inline onclick handler
window.startFlashcards = startFlashcards;

document.addEventListener("DOMContentLoaded", () => {
	document.addEventListener("keydown", function (event) {
		// ENTER CONTROLS
		if (event.key === "Enter") {
			switch (pageState) {
				case "upload":
					const fileInput = document.getElementById("file-input");
					if (fileInput) fileInput.click();
					break;
				case "review":
					startFlashcards();
					break;
				case "flashcards":
					if (!document.activeElement.classList.contains("keyword-input")) {
						if (!event.shiftKey) {
							if (!answersRevealed) {
								submitAnswers();
							} else if (!justSubmitted) {
								markCardCorrect();
							}
						} else {
							if (!answersRevealed) {
								submitAnswers();
								revealAnswers();
							} else if (!justSubmitted) {
								markCardIncorrect();
							}
						}
					}
					break;
				case "complete":
					startFlashcards();
					break;
			}
		} else if (event.key === "Escape") {
			switch (pageState) {
				case "review":
					document.getElementById("file-input").click();
					break;
				case "flashcards":
					backToEditing();
					break;
				case "complete":
					backToEditing();
					break;
			}
		}
	});
});
