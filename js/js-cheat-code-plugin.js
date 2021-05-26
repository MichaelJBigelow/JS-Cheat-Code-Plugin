class CheatCodeEngine {
	
	constructor(){

		// USER SETUP
		this.cheatCodes        = [
			{
				id: "Contra",
				code: "ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,KeyB,KeyA"
			}
		];
		this.maxCheatDelay = 600; // Max milliseconds allowed between keystrokes during code entry

		// GENERAL PROPERTIES
		this.cheatAttempt      = ""; // Tracks user's cheat code entry. Stored as KeyboardEvent codes
		this.recordedKeyCodes  = ""; // Tracks KeyboardEvent codes for cheat code creation
		this.expired           = true; // Set true if cheat wasn't completed within the allotted time
		this.keystrokeTimerRef = null; // Store interval id
		this.currentTime       = new Date().getTime();
		this.lastKeystrokeTime = this.currentTime;

	}

	cheatCodeRecord( KeyboardEvent ){

		// TODO: Store key press as key code

	}

	keypress( KeyboardEvent ){ // Process keystroke as part of a cheat code attempt

		this.expireCheck();

		clearTimeout( this.keystrokeTimerRef );

		if( this.expired ){

			this.reset();

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

				this.reset();
				console.log( `Cheat Code Success: ${this.cheatCodes[i].id}` );

				return;

			}

		}

		this.lastKeystrokeTime = new Date().getTime(); // Update keystroke time
		this.keystrokeTimerRef = setTimeout( this.reset, this.maxCheatDelay );

	}

	expireCheck(){ // Check if the cheat code was entered within the allotted time

		this.currentTime = new Date().getTime();
		let elapsedTime  = this.currentTime - this.lastKeystrokeTime;

		if( elapsedTime > this.maxCheatDelay ){

			this.expired = true;

		}else{

			this.expired = false;

		}

	}

	reset(){ // Reset cheat attempt

		this.cheatAttempt = "";
		this.currentTime = new Date().getTime();
		this.lastKeystrokeTime = this.currentTime;

	}

}

const jsCheats = new CheatCodeEngine();