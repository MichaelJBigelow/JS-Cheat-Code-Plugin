class CheatCodeEngine {
	
	constructor(){

		// USER SETUP
		this.cheatCodes        = [
			{
				id: "Contra",
				code: "ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,KeyB,KeyA"
			}
		];
		this.maxCheatEntryTime = 750; // Milliseconds allowed to enter a cheat code
		this.expireCheckDelay  = 10; // Milliseconds between each cheat code expiration check

		// GENERAL PROPERTIES
		this.cheatAttempt      = ""; // Tracks user's cheat code entry. Stored as KeyboardEvent codes
		this.recordedKeyCodes  = ""; // Tracks KeyboardEvent codes for cheat code creation
		this.expired           = true; // Set true if cheat wasn't completed within the allotted time
		this.keystrokeTimerRef = null; // Store interval id
		this.cheatStartTime    = new Date().getTime();
		this.currentTime       = this.cheatStartTime;
		this.lastKeystrokeTime = this.cheatStartTime;
	}

	cheatCodeRecord( KeyboardEvent ){
		// Store key press as key code
		console.log( `CheatCodeEngine.cheatCodeRecord( ${KeyboardEvent.code} )` );
	}

	keypress( KeyboardEvent ){
		// Process keystroke as part of a cheat code attempt
		//console.log( `CheatCodeEngine.keypress( ${KeyboardEvent.code} )` );

		this.expireCheck();

		if( this.expired ){

			this.cheatAttempt = ""; // Clear cheat attempt

			// Reset time trackers
			this.currentTime = new Date().getTime();
			this.cheatStartTime = this.currentTime;
			this.lastKeystrokeTime = this.currentTime;

			this.expired = false;

		}

		// Add key code for current keystroke
		if( this.cheatAttempt.length == 0 ){

			this.cheatAttempt = KeyboardEvent.code; // Add 1st key code to cheat attempt

		}else{

			this.cheatAttempt += "," + KeyboardEvent.code; // Append key code to cheat attempt

		}

		// Check for matching cheat code
		for( let i = 0; i < this.cheatCodes.length; i++ ){

			if( this.cheatAttempt == this.cheatCodes[i].code ){ // Match found

				this.cheatAttempt = "";
				this.expired = true;
				console.log( `Cheat Code Success: ${this.cheatCodes[i].id}` );

				return;

			}

		}

	}

	expireCheck(){ // Check if the cheat code was entered within the allotted time

		this.currentTime = new Date().getTime();
		let elapsedTime  = this.cheatStartTime - this.currentTime.toExponential;

		if( elapsedTime > this.maxCheatEntryTime ){

			this.expired = true;

		}else{

			this.expired = false;

		}

	}

}

const jsCheats = new CheatCodeEngine();