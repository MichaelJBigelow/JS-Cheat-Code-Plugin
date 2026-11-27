/**
 * JS Cheat Code Plugin
 *
 * Listens for keyboard input and fires an event when a registered cheat code is entered.
 *
 * Events (listen with jsCheats.addEventListener( name, handler )):
 *   "attempt" - a keystroke was added to the current attempt. detail: { attempt }
 *   "success" - a cheat code was entered. detail: { id, attempt }
 *   "reset"   - the current attempt was cleared. detail: { attempt }
 *   "record"  - a keystroke was recorded while recording. detail: { attempt, recorded }
 *
 * Recording a new cheat code:
 *   jsCheats.startRecording();
 *   // ...user presses keys...
 *   jsCheats.addCheatCode( { id: "MyCheat", code: jsCheats.stopRecording() } );
 */
class CheatCodeEngine extends EventTarget {

	static DEFAULT_CHEAT_CODES = [
		{
			id: "Contra",
			code: [ "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA" ]
		}
	];

	#cheatCodes        = new Map(); // id -> { id, keys, onActivate }
	#attempt           = []; // User's current entry, stored as KeyboardEvent codes
	#longestCode       = 0; // Most keys the attempt ever needs to hold
	#lastKeystrokeTime = 0;
	#timerId           = null;
	#listener          = null; // AbortController for the keydown listener
	#recordedKeys      = null; // KeyboardEvent codes captured while recording. null when not recording
	#lastRecording     = []; // Keys from the last finished recording

	constructor( {
		cheatCodes    = CheatCodeEngine.DEFAULT_CHEAT_CODES,
		maxCheatDelay = 600, // Max milliseconds allowed between keystrokes during code entry
		target        = document, // Element (or document) to listen on
		ignoreInputs  = true, // Ignore keystrokes typed into inputs, textareas and contenteditable elements
		autoStart     = true
	} = {} ){

		super();

		this.maxCheatDelay = maxCheatDelay;
		this.target        = target;
		this.ignoreInputs  = ignoreInputs;

		cheatCodes.forEach( cheatCode => this.addCheatCode( cheatCode ) );

		if( autoStart ){

			this.start();

		}

	}

	// The current attempt as a comma separated string of KeyboardEvent codes
	get cheatAttempt(){

		return this.#attempt.join( "," );

	}

	get cheatCodes(){

		return [ ...this.#cheatCodes.values() ].map( ( { id, keys } ) => ( { id, code: [ ...keys ] } ) );

	}

	get listening(){

		return this.#listener !== null;

	}

	get recording(){

		return this.#recordedKeys !== null;

	}

	// The keys captured by the current (or last) recording as a comma separated string of KeyboardEvent codes
	get recordedKeyCodes(){

		return ( this.#recordedKeys ?? this.#lastRecording ).join( "," );

	}

	// code: an array of KeyboardEvent codes, or a comma separated string of them
	// onActivate: optional callback, called with ( id ) when the code is entered
	addCheatCode( { id, code, onActivate } ){

		const keys = ( Array.isArray( code ) ? code : String( code ?? "" ).split( "," ) )
			.map( key => String( key ).trim() )
			.filter( Boolean );

		if( !id || keys.length === 0 ){

			throw new TypeError( "A cheat code needs an id and at least one key" );

		}

		this.#cheatCodes.set( id, { id, keys, onActivate } );
		this.#updateLongestCode();

		return this;

	}

	removeCheatCode( id ){

		const removed = this.#cheatCodes.delete( id );

		this.#updateLongestCode();

		return removed;

	}

	start(){ // Begin listening for keystrokes

		if( this.listening ){

			return this;

		}

		this.#listener = new AbortController();
		this.target.addEventListener( "keydown", event => this.keypress( event ), { signal: this.#listener.signal } );

		return this;

	}

	stop(){ // Stop listening for keystrokes

		this.#listener?.abort();
		this.#listener = null;
		this.reset();

		return this;

	}

	keypress( event ){ // Process keystroke as part of a cheat code attempt. Returns the matched cheat id, if any

		if( this.recording ){

			this.cheatCodeRecord( event );

			return null;

		}

		if( this.#isIgnored( event ) ){

			return null;

		}

		clearTimeout( this.#timerId );

		// Timers can be throttled (e.g. background tabs), so check the elapsed time as well
		const now = performance.now();

		if( now - this.#lastKeystrokeTime > this.maxCheatDelay ){

			this.#attempt = [];

		}

		this.#lastKeystrokeTime = now;

		// Keep only as many keys as the longest code needs, so a wrong key part way through
		// doesn't spoil the rest of the attempt
		this.#attempt.push( event.code );
		this.#attempt.splice( 0, this.#attempt.length - this.#longestCode );

		this.#emit( "attempt" );

		const match = [ ...this.#cheatCodes.values() ].find( ( { keys } ) => this.#attemptEndsWith( keys ) );

		if( match ){

			this.#emit( "success", { id: match.id } );
			this.reset();
			match.onActivate?.( match.id );

			return match.id;

		}

		this.#timerId = setTimeout( () => this.reset(), this.maxCheatDelay );

		return null;

	}

	reset(){ // Reset cheat attempt

		clearTimeout( this.#timerId );
		this.#timerId = null;

		if( this.#attempt.length === 0 ){

			return;

		}

		this.#attempt = [];
		this.#emit( "reset" );

	}

	startRecording(){ // Capture keystrokes for a new cheat code instead of matching them

		this.reset();
		this.#recordedKeys = [];

		return this;

	}

	stopRecording(){ // Stop capturing keystrokes. Returns the recorded KeyboardEvent codes, ready for addCheatCode()

		if( !this.recording ){

			return [];

		}

		this.#lastRecording = this.#recordedKeys;
		this.#recordedKeys  = null;

		return [ ...this.#lastRecording ];

	}

	cheatCodeRecord( event ){ // Store key press as key code. Returns the keys recorded so far, or null if the keystroke was skipped

		if( !this.recording || this.#isIgnored( event ) ){

			return null;

		}

		this.#recordedKeys.push( event.code );
		this.#emit( "record", { recorded: this.recordedKeyCodes } );

		return [ ...this.#recordedKeys ];

	}

	#attemptEndsWith( keys ){

		const offset = this.#attempt.length - keys.length;

		return offset >= 0 && keys.every( ( key, i ) => key === this.#attempt[ offset + i ] );

	}

	#updateLongestCode(){

		this.#longestCode = Math.max( 0, ...[ ...this.#cheatCodes.values() ].map( ( { keys } ) => keys.length ) );

		if( this.#attempt.length > this.#longestCode ){

			this.#attempt.splice( 0, this.#attempt.length - this.#longestCode );

		}

	}

	#isIgnored( event ){

		return !event.code || event.repeat || ( this.ignoreInputs && this.#isEditable( event.target ) );

	}

	#isEditable( element ){

		return element instanceof Element && ( element.isContentEditable || element.matches( "input, textarea, select" ) );

	}

	#emit( type, detail = {} ){

		this.dispatchEvent( new CustomEvent( type, { detail: { ...detail, attempt: this.cheatAttempt } } ) );

	}

}

const jsCheats = new CheatCodeEngine();
