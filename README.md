# JS-Cheat-Code-Plugin
The JS Cheat Code Plugin brings classic console cheat code functionality to modern websites.

## Demo

Open `debug.html` in a browser to try the plugin. You can open the file directly, or serve the folder locally (for example with `python3 -m http.server`) and visit `/debug.html`.

The demo page has an animated 8-bit background and shows the engine at work:

- Enter the built-in code, `↑ ↑ ↓ ↓ ← → ← → B A`, and its key caps light up as you go
- Use the on-screen controller on touch screens or with a mouse
- See your current attempt, the last code you unlocked and how many you've unlocked
- Record a new code with the Record button and try it straight away
- See every registered code, lit up as you enter it

The page uses the Press Start 2P and VT323 fonts from Google Fonts, and falls back to the system monospace font offline. With "reduce motion" turned on, the background stays still.

The demo's look is fan art inspired by the NES version of Contra. It is not affiliated with, endorsed by, or sponsored by Nintendo, Konami or the Contra series.

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

The demo page has a Record button that does this and saves each recording as a new code.

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
