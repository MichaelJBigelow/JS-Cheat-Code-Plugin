/**
 * Demo page wiring: shows the current attempt, unlocked codes, recording and every registered code
 * as 8-bit key caps, and drives the on-screen controller.
 */
( () => {

	"use strict";

	const $ = selector => document.querySelector( selector );

	const heroKeysElement     = $( "#hero-keys" );
	const cheatAttemptElement = $( "#cheat-attempt" );
	const cheatIdElement      = $( "#cheat-id" );
	const unlockedCard        = $( "#unlocked-card" );
	const unlockTotalElement  = $( "#unlock-total" );
	const scoreElement        = $( "#score-value" );
	const recordButton        = $( "#record-button" );
	const recordLabel         = recordButton.querySelector( ".button__label" );
	const recorderStatus      = $( "#recorder-status" );
	const recordedKeysElement = $( "#recorded-keys" );
	const codeList            = $( "#code-list" );
	const snackbar            = $( "#snackbar" );

	const ARROW_ROTATION = { ArrowUp: 0, ArrowRight: 90, ArrowDown: 180, ArrowLeft: 270 };
	const KEY_NAMES      = {
		Space: "SPC", Enter: "ENT", Escape: "ESC", Backspace: "BS", Tab: "TAB", CapsLock: "CAP",
		ShiftLeft: "SHF", ShiftRight: "SHF", ControlLeft: "CTL", ControlRight: "CTL",
		AltLeft: "ALT", AltRight: "ALT", MetaLeft: "CMD", MetaRight: "CMD",
		Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]", Backslash: "\\",
		Semicolon: ";", Quote: "'", Comma: ",", Period: ".", Slash: "/", Backquote: "`"
	};
	const ARROW_PATH = "M3 0h1v1h1v1h1v1h1v1h-2v3h-3v-3h-2v-1h1v-1h1v-1h1z"; // 7x7 pixel arrow

	let attempt          = [];
	let unlockCount      = 0;
	let customCheatCount = 0;
	let snackbarTimer    = null;

	const celebrating = new Set(); // Codes shown fully lit for a moment after they're entered

	function arrowSvg( rotation ){

		return `<svg viewBox="0 0 7 7" aria-hidden="true" style="transform: rotate(${ rotation }deg)"><path d="${ ARROW_PATH }"/></svg>`;

	}

	function keyLabel( code ){

		return KEY_NAMES[ code ] ?? code.replace( /^(Key|Digit|Numpad)/, "" ).toUpperCase().slice( 0, 3 );

	}

	function keycap( code ){

		const element = document.createElement( "span" );

		element.className = "keycap";
		element.title     = code;
		element.setAttribute( "role", "img" );
		element.setAttribute( "aria-label", code );

		if( code in ARROW_ROTATION ){

			element.innerHTML = arrowSvg( ARROW_ROTATION[ code ] );

		}else{

			element.textContent = keyLabel( code );

		}

		return element;

	}

	function parseKeys( value ){

		return String( value ?? "" ).split( "," ).filter( Boolean );

	}

	// How many keys of the code the attempt has entered so far
	function progressFor( keys, keysEntered ){

		for( let count = Math.min( keys.length, keysEntered.length ); count > 0; count-- ){

			const offset = keysEntered.length - count;

			if( keys.slice( 0, count ).every( ( key, i ) => key === keysEntered[ offset + i ] ) ){

				return count;

			}

		}

		return 0;

	}

	function heroCode(){

		const codes = jsCheats.cheatCodes;

		return codes.find( ( { id } ) => id === "Contra - 30 Lives" ) ?? codes[ 0 ];

	}

	// Key caps are built once per code and lit in place, so only newly lit keys animate
	function buildHero(){

		const code = heroCode();

		heroKeysElement.replaceChildren( ...( code?.code ?? [] ).map( keycap ) );
		heroKeysElement.dataset.id = code?.id ?? "";

	}

	function buildCodeList(){

		codeList.replaceChildren( ...jsCheats.cheatCodes.map( ( { id, code } ) => {

			const item  = document.createElement( "li" );
			const head  = document.createElement( "div" );
			const name  = document.createElement( "span" );
			const count = document.createElement( "span" );
			const keys  = document.createElement( "div" );

			item.className  = "code-item";
			item.dataset.id = id;
			head.className  = "code-item__head";
			name.className  = "code-item__name";
			count.className = "code-item__count";
			keys.className  = "key-row key-row--small";

			name.textContent = id;
			keys.append( ...code.map( keycap ) );
			head.append( name, count );
			item.append( head, keys );

			return item;

		} ) );

	}

	function lightKeys( row, id, keys ){

		const lit = celebrating.has( id ) ? keys.length : progressFor( keys, attempt );

		[ ...row.children ].forEach( ( key, i ) => key.classList.toggle( "is-lit", i < lit ) );

		return lit;

	}

	function updateProgress(){

		const codes = new Map( jsCheats.cheatCodes.map( ( { id, code } ) => [ id, code ] ) );
		const hero  = heroKeysElement.dataset.id;

		if( codes.has( hero ) ){

			lightKeys( heroKeysElement, hero, codes.get( hero ) );

		}

		for( const item of codeList.children ){

			const keys = codes.get( item.dataset.id ) ?? [];
			const lit  = lightKeys( item.querySelector( ".key-row" ), item.dataset.id, keys );

			item.classList.toggle( "is-complete", lit === keys.length );
			item.querySelector( ".code-item__count" ).textContent = `${ lit }/${ keys.length }`;

		}

	}

	function renderAttempt(){

		const caps = attempt.map( keycap );

		caps.at( -1 )?.classList.add( "is-new" );
		cheatAttemptElement.replaceChildren( ...caps );

	}

	function showSnackbar( message ){

		clearTimeout( snackbarTimer );
		snackbar.textContent = message;
		snackbar.classList.add( "is-visible" );
		snackbarTimer = setTimeout( () => snackbar.classList.remove( "is-visible" ), 3000 );

	}

	function restartAnimation( element, className ){

		element.classList.remove( className );
		void element.offsetWidth; // Restart the CSS animation
		element.classList.add( className );

	}

	jsCheats.addEventListener( "attempt", ( { detail } ) => {

		attempt = parseKeys( detail.attempt );
		renderAttempt();
		updateProgress();

	} );

	jsCheats.addEventListener( "reset", ( { detail } ) => {

		attempt = parseKeys( detail.attempt );
		renderAttempt();
		updateProgress();

	} );

	jsCheats.addEventListener( "success", ( { detail } ) => {

		unlockCount++;

		cheatIdElement.textContent     = detail.id;
		unlockTotalElement.textContent = unlockCount;
		scoreElement.textContent       = String( unlockCount ).padStart( 2, "0" );

		celebrating.add( detail.id );
		setTimeout( () => {

			celebrating.delete( detail.id );
			updateProgress();

		}, 1200 );

		restartAnimation( unlockedCard, "is-celebrating" );
		restartAnimation( scoreElement, "is-celebrating" );
		showSnackbar( `Cheat unlocked: ${ detail.id }` );
		window.pixelScene?.flash();

	} );

	// Recording: press Record, type a sequence, press Stop to save it as a new cheat code
	jsCheats.addEventListener( "record", ( { detail } ) => {

		recordedKeysElement.replaceChildren( ...parseKeys( detail.recorded ).map( keycap ) );

	} );

	recordButton.addEventListener( "click", () => {

		recordButton.blur(); // Keep Space/Enter from pressing the button while recording

		if( !jsCheats.recording ){

			jsCheats.startRecording();
			recordButton.classList.add( "is-recording" );
			recordButton.setAttribute( "aria-pressed", "true" );
			recordLabel.textContent    = "Stop";
			recorderStatus.textContent = "Recording... type your sequence, then press Stop.";
			recordedKeysElement.replaceChildren();
			return;

		}

		const keys = jsCheats.stopRecording();

		recordButton.classList.remove( "is-recording" );
		recordButton.setAttribute( "aria-pressed", "false" );
		recordLabel.textContent = "Record";

		if( keys.length === 0 ){

			recorderStatus.textContent = "Nothing recorded. Press Record to try again.";
			return;

		}

		const id = `Custom ${ ++customCheatCount }`;

		jsCheats.addCheatCode( { id, code: keys } );
		recorderStatus.textContent = `Saved as "${ id }". Enter it to unlock it.`;
		buildCodeList();
		updateProgress();
		showSnackbar( `Saved new code: ${ id }` );

	} );

	// On-screen controller: each button sends the matching keydown to the engine
	document.querySelectorAll( "[data-code]" ).forEach( button => {

		button.addEventListener( "mousedown", event => event.preventDefault() ); // Don't take focus

		button.addEventListener( "pointerdown", event => {

			event.preventDefault();
			document.dispatchEvent( new KeyboardEvent( "keydown", { code: button.dataset.code, key: button.dataset.key, bubbles: true } ) );

		} );

	} );

	document.querySelectorAll( ".dpad__button" ).forEach( button => {

		button.innerHTML = arrowSvg( ARROW_ROTATION[ button.dataset.code ] );

	} );

	$( "#max-delay" ).textContent = jsCheats.maxCheatDelay;

	buildHero();
	buildCodeList();
	updateProgress();

} )();
