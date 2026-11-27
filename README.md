# JS-Cheat-Code-Plugin
The JS Cheat Code Plugin brings classic console cheat code functionality to modern websites.

## Usage

Include the script. It creates a global `jsCheats` engine that listens for `keydown` on the document.

```html
<script src="js/js-cheat-code-plugin.js"></script>
<script>
	jsCheats.addCheatCode( {
		id: "Glitch",
		code: [ "KeyG", "KeyL", "KeyI", "KeyT", "KeyC", "KeyH" ], // KeyboardEvent.code values, or a comma separated string
		onActivate: id => console.log( `${id} unlocked` )
	} );

	jsCheats.addEventListener( "success", ( { detail } ) => console.log( detail.id ) );
</script>
```

Events: `attempt` (a key was added), `success` (a code was entered, `detail.id`), `reset` (the attempt was cleared) and `record` (a key was recorded, `detail.recorded`). Each event's `detail.attempt` holds the current attempt.

Methods: `addCheatCode()`, `removeCheatCode( id )`, `start()`, `stop()`, `reset()`, `startRecording()` and `stopRecording()`.

### Recording a cheat code

While recording, key presses are stored instead of being matched against existing codes. `stopRecording()` returns the recorded keys, ready to pass to `addCheatCode()`. `jsCheats.recordedKeyCodes` holds them as a comma separated string.

```js
jsCheats.startRecording();
// ...the user presses their keys...
jsCheats.addCheatCode( { id: "MyCheat", code: jsCheats.stopRecording() } );
```

The debug page has a Record button that does this and saves each recording as a new code.

To configure your own engine, create one with options:

```js
const cheats = new CheatCodeEngine( {
	cheatCodes: [ { id: "Contra - 30 Lives", code: "ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,KeyB,KeyA" } ],
	maxCheatDelay: 600, // Max milliseconds between keystrokes
	target: document, // Element to listen on
	ignoreInputs: true, // Ignore typing in inputs, textareas and contenteditable elements
	autoStart: true
} );
```
