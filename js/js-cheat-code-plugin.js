class CheatCodeEngine {
	
	constructor(){

		// USER SETUP
		this.cheatCodes        = [
			{
				id: "Contra",
				code: "ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,KeyB,KeyA"
			}
		];
		this.maxCheatEntryTime = 100; // Milliseconds allowed to enter a cheat code
		this.expireCheckDelay  = 10; // Milliseconds between each cheat code expiration check

		// GENERAL PROPERTIES
		this.cheatAttempt      = ""; // Tracks user's cheat code entry. Stored as KeyboardEvent codes
		this.recordedKeyCodes  = ""; // Tracks KeyboardEvent codes for cheat code creation
		this.expired           = true; // Set true if cheat wasn't completed within the allotted time
		this.keystrokeTimerRef = null; // Store interval id
		this.currentTime       = new Date().getTime();
		this.lastKeystrokeTime = this.currentTime;
	}

	cheatCodeRecord( KeyboardEvent ){
		// Store key press as key code
		console.log( `CheatCodeEngine.cheatCodeRecord( ${KeyboardEvent.code} )` );
	}

	keypress( KeyboardEvent ){
		// Process keystroke as part of a cheat code attempt
		console.log( `CheatCodeEngine.keypress( ${KeyboardEvent.code} )` );
	}

	expireCheck(){
		// Check if the cheat code was entered within the allotted time
		console.log( `CheatCodeEngine.expireCheck()` );
	}

}

const jsCheats = new CheatCodeEngine();