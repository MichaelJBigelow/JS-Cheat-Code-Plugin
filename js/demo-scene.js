/**
 * Demo page background: an original 8-bit jungle scene (night sky, snowy peaks, palm canopy,
 * rocky cliff and water) drawn on a small canvas and scaled up by a whole number so the pixels stay crisp.
 * The layers scroll slowly with parallax. With reduced motion turned on, a single still frame is drawn.
 *
 * window.pixelScene.flash() flashes the screen (used when a cheat code is unlocked).
 */
( () => {

	"use strict";

	const canvas = document.querySelector( "#scene" );

	if( !canvas ){

		return;

	}

	const ctx          = canvas.getContext( "2d" );
	const reduceMotion = matchMedia( "(prefers-reduced-motion: reduce)" );

	// NES-like palette
	const COLORS = {
		sky: "#000000",
		haze: "#0c0c34",
		hazeLight: "#1c1c5c",
		star: "#fcfcfc",
		starDim: "#7c7c9c",
		snow: "#fcfcfc",
		snowShade: "#bcbcbc",
		snowGrain: "#7c7c7c",
		snowBase: "#5c5c7c",
		leafDeep: "#003000",
		leafDark: "#004400",
		leaf: "#005800",
		leafMid: "#00a800",
		leafLight: "#58d854",
		grassEdge: "#b8f818",
		rockGap: "#1c0c00",
		rockDark: "#503000",
		rockMid: "#ac7c00",
		rockLight: "#f8b800",
		rockSpeck: "#fce0a8",
		water: "#0058f8",
		waterDeep: "#0040c8",
		waterLight: "#3cbcfc",
		foam: "#fcfcfc"
	};

	// Heights (in scene pixels) of each band, stacked from the bottom of the screen
	const WATER_HEIGHT    = 26;
	const CLIFF_OFFSET    = 62; // Cliff top sits this far above the water
	const GRASS_OFFSET    = 14; // Grass ledge tile starts this far above the cliff
	const JUNGLE_OFFSET   = 34;
	const MOUNTAIN_OFFSET = 42;
	const MIN_HEIGHT      = 180;
	const CAMERA_SPEED    = 10; // Scene pixels per second at the front layer
	const FRAME_TIME      = 1000 / 30;

	let width     = 0;
	let height    = 0;
	let scale     = 1;
	let sky       = null;
	let twinklers = [];
	let lastFrame = 0;
	let camera    = 0;
	let flashAt   = -Infinity;
	let frameId   = null;

	// Small seeded random number generator, so the scene looks the same on every visit
	function seededRandom( seed ){

		return () => {

			seed = ( seed + 0x6d2b79f5 ) | 0;

			let t = Math.imul( seed ^ ( seed >>> 15 ), 1 | seed );

			t = ( t + Math.imul( t ^ ( t >>> 7 ), 61 | t ) ) ^ t;

			return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;

		};

	}

	// Draws a tile on its own canvas. px() wraps x around the tile so tiles repeat without seams
	function makeTile( tileWidth, tileHeight, draw ){

		const tile = document.createElement( "canvas" );
		const g    = tile.getContext( "2d" );

		tile.width  = tileWidth;
		tile.height = tileHeight;

		const px = ( x, y, color ) => {

			y = Math.round( y );

			if( y < 0 || y >= tileHeight ){

				return;

			}

			g.fillStyle = color;
			g.fillRect( ( ( Math.round( x ) % tileWidth ) + tileWidth ) % tileWidth, y, 1, 1 );

		};

		draw( px, g );

		return tile;

	}

	function makeMountains( random ){

		const tileWidth  = 240;
		const tileHeight = 60;
		const peaks      = [];

		for( let x = 8; x < tileWidth - 10; x += 26 + Math.floor( random() * 22 ) ){

			peaks.push( { x, height: 28 + Math.floor( random() * 28 ), slope: 0.95 + random() * 0.45 } );

		}

		return makeTile( tileWidth, tileHeight, px => {

			for( let x = 0; x < tileWidth; x++ ){

				for( let y = 0; y < tileHeight; y++ ){

					let peak = null;
					let dx   = 0;
					let top  = 0;

					// The tallest peak covering this pixel is the one in front
					for( const p of peaks ){

						for( const shift of [ -tileWidth, 0, tileWidth ] ){

							const d       = x - ( p.x + shift );
							const surface = tileHeight - p.height + Math.abs( d ) * p.slope;

							if( y >= surface && ( !peak || p.height > peak.height ) ){

								peak = p;
								dx   = d;
								top  = surface;

							}

						}

					}

					if( !peak ){

						continue;

					}

					const r = random();

					if( y - top < 1 && r < 0.35 ){ // Rough, grainy edge

						continue;

					}

					let color = COLORS.snow;

					if( dx > 0 && ( ( x + y ) % 2 === 0 || r < 0.15 ) ){ // Dithered shade on the far side

						color = COLORS.snowShade;

					}

					if( r < 0.07 ){

						color = COLORS.snowGrain;

					}

					const fadeStart = tileHeight - 16;

					if( y > fadeStart && r < ( y - fadeStart ) / 16 ){

						color = COLORS.snowBase;

					}

					px( x, y, color );

				}

			}

		} );

	}

	function drawPalm( px, random, cx, cy ){

		const fronds = [ -2.85, -2.35, -1.9, -1.25, -0.8, -0.3 ]; // Angles in radians, fanning upward

		for( const angle of fronds ){

			const length = 7 + random() * 4;

			for( let t = 0; t <= length; t++ ){

				const x = cx + Math.cos( angle ) * t;
				const y = cy + Math.sin( angle ) * t + 0.09 * t * t; // Fronds droop under their own weight

				px( x, y, COLORS.leafMid );

				if( t > 2 && t % 2 === 1 ){ // Leaflets hanging from the frond

					px( x, y + 1, COLORS.leaf );
					px( x, y + 2, COLORS.leaf );

				}

				if( t % 3 === 1 && t < length - 2 ){

					px( x, y - 1, COLORS.leafLight );

				}

			}

		}

		px( cx, cy, COLORS.leafLight );
		px( cx + 1, cy, COLORS.leafMid );

	}

	function makeJungle( random ){

		const tileWidth  = 96;
		const tileHeight = 44;

		return makeTile( tileWidth, tileHeight, ( px, g ) => {

			g.fillStyle = COLORS.leafDark;
			g.fillRect( 0, 16, tileWidth, tileHeight - 16 );

			for( let i = 0; i < 320; i++ ){

				px( random() * tileWidth, 16 + random() * ( tileHeight - 16 ), random() < 0.5 ? COLORS.leaf : COLORS.leafDeep );

			}

			// Back row of palms, then a front row lower down
			for( const rowY of [ 13, 21 ] ){

				for( let x = random() * 8; x < tileWidth; x += 11 + random() * 8 ){

					drawPalm( px, random, Math.round( x ), Math.round( rowY + random() * 4 ) );

				}

			}

		} );

	}

	function makeGrass( random ){

		const tileWidth  = 64;
		const tileHeight = 18;

		return makeTile( tileWidth, tileHeight, px => {

			// Bushes along the treeline
			for( let cx = random() * 6; cx < tileWidth; cx += 9 + random() * 6 ){

				const radius = 4 + random() * 3;

				for( let dy = -Math.ceil( radius ); dy <= 1; dy++ ){

					for( let dx = -Math.ceil( radius ); dx <= Math.ceil( radius ); dx++ ){

						const distance = Math.hypot( dx, dy );

						if( distance > radius ){

							continue;

						}

						let color = random() < 0.12 ? COLORS.leaf : COLORS.leafMid;

						if( distance > radius - 1.5 && dy < 0 && dx <= 1 ){

							color = COLORS.leafLight;

						}

						px( cx + dx, 8 + dy, color );

					}

				}

			}

			// Grass ledge
			for( let x = 0; x < tileWidth; x++ ){

				px( x, 9, COLORS.grassEdge );
				px( x, 10, random() < 0.2 ? COLORS.grassEdge : COLORS.leafLight );
				px( x, 11, COLORS.leafLight );
				px( x, 12, random() < 0.3 ? COLORS.leafLight : COLORS.leafMid );
				px( x, 13, COLORS.leafMid );
				px( x, 14, random() < 0.25 ? COLORS.leaf : COLORS.leafMid );

				// Roots and moss hanging over the cliff edge
				const drip = random() < 0.45 ? Math.floor( random() * 4 ) : 0;

				for( let d = 0; d < drip; d++ ){

					px( x, 15 + d, d === 0 ? COLORS.leafMid : COLORS.leaf );

				}

			}

		} );

	}

	function drawRock( px, random, cx, cy, rx, ry ){

		for( let dy = -Math.ceil( ry ); dy <= Math.ceil( ry ); dy++ ){

			for( let dx = -Math.ceil( rx ); dx <= Math.ceil( rx ); dx++ ){

				const d = ( dx / rx ) ** 2 + ( dy / ry ) ** 2;

				if( d > 1 ){

					continue;

				}

				const light = -( dx / rx ) * 0.6 - ( dy / ry ) * 0.8; // Lit from the top left

				let color;

				if( d > 0.78 ){

					color = light > 0.2 ? COLORS.rockMid : COLORS.rockDark;

				}else if( light > 0.3 ){

					color = random() < 0.08 ? COLORS.rockSpeck : COLORS.rockLight;

				}else if( light > -0.3 ){

					color = random() < 0.06 ? COLORS.rockDark : COLORS.rockMid;

				}else{

					color = COLORS.rockDark;

				}

				px( cx + dx, cy + dy, color );

			}

		}

	}

	function drawLedge( px, random, x, y, ledgeWidth ){

		for( let i = 0; i < ledgeWidth; i++ ){

			const inset = i === 0 || i === ledgeWidth - 1; // Rounded ends

			if( !inset ){

				px( x + i, y, COLORS.grassEdge );

			}

			px( x + i, y + 1, COLORS.leafLight );
			px( x + i, y + 2, random() < 0.3 ? COLORS.leafLight : COLORS.leafMid );
			px( x + i, y + 3, COLORS.leafMid );
			px( x + i, y + 4, random() < 0.3 ? COLORS.leaf : COLORS.leafMid );
			px( x + i, y + 5, COLORS.rockGap );

			if( random() < 0.35 ){

				px( x + i, y + 5, COLORS.leaf );
				px( x + i, y + 6, COLORS.leaf );

			}

		}

	}

	function makeCliff( random ){

		const tileWidth  = 200; // A multiple of the rock spacing, so the tile wraps cleanly
		const tileHeight = 70;
		const spacing    = 20;
		const rowHeight  = 14;

		return makeTile( tileWidth, tileHeight, ( px, g ) => {

			g.fillStyle = COLORS.rockGap;
			g.fillRect( 0, 0, tileWidth, tileHeight );

			for( let row = 0, y = 3; y < tileHeight + rowHeight; row++, y += rowHeight ){

				const offset = row % 2 ? spacing / 2 : 0;

				for( let x = offset; x < tileWidth + offset; x += spacing ){

					drawRock( px, random, x + random() * 3, y + random() * 2, 9 + random() * 2.5, 7.5 + random() * 1.5 );

				}

			}

			drawLedge( px, random, 22, 22, 46 );
			drawLedge( px, random, 120, 42, 54 );

		} );

	}

	const random   = seededRandom( 1987 );
	const mountain = makeMountains( random );
	const jungle   = makeJungle( random );
	const grass    = makeGrass( random );
	const cliff    = makeCliff( random );

	function layout(){

		const waterTop    = height - WATER_HEIGHT;
		const cliffTop    = waterTop - CLIFF_OFFSET;
		const grassTop    = cliffTop - GRASS_OFFSET;
		const jungleTop   = grassTop - JUNGLE_OFFSET;
		const mountainTop = jungleTop - MOUNTAIN_OFFSET;

		return { waterTop, cliffTop, grassTop, jungleTop, mountainTop, horizon: jungleTop + 16 };

	}

	function buildSky(){

		const { horizon } = layout();
		const skyRandom   = seededRandom( width * 31 + height );

		sky       = document.createElement( "canvas" );
		sky.width = width;
		sky.height = Math.max( 1, horizon );

		const g = sky.getContext( "2d" );

		g.fillStyle = COLORS.sky;
		g.fillRect( 0, 0, sky.width, sky.height );

		// Dithered haze toward the horizon
		const bands = [
			{ from: horizon - 36, to: horizon - 24, color: COLORS.haze, test: ( x, y ) => ( x + y * 2 ) % 4 === 0 },
			{ from: horizon - 24, to: horizon - 12, color: COLORS.haze, test: ( x, y ) => ( x + y ) % 2 === 0 },
			{ from: horizon - 12, to: horizon, color: COLORS.haze, test: () => true },
			{ from: horizon - 8, to: horizon, color: COLORS.hazeLight, test: ( x, y ) => ( x + y ) % 2 === 0 }
		];

		for( const band of bands ){

			g.fillStyle = band.color;

			for( let y = Math.max( 0, band.from ); y < band.to; y++ ){

				for( let x = 0; x < width; x++ ){

					if( band.test( x, y ) ){

						g.fillRect( x, y, 1, 1 );

					}

				}

			}

		}

		// Stars. Some twinkle, and are drawn every frame instead
		twinklers = [];

		const starCount = Math.round( ( width * horizon ) / 150 );

		for( let i = 0; i < starCount; i++ ){

			const x = Math.floor( skyRandom() * width );
			const y = Math.floor( skyRandom() * ( horizon - 14 ) );

			if( skyRandom() < 0.2 ){

				twinklers.push( { x, y, phase: skyRandom() * Math.PI * 2, speed: 1 + skyRandom() * 2 } );

				continue;

			}

			g.fillStyle = skyRandom() < 0.3 ? COLORS.star : COLORS.starDim;
			g.fillRect( x, y, 1, 1 );

		}

	}

	function drawTiled( tile, offset, y ){

		const start = -( ( Math.floor( offset ) % tile.width ) + tile.width ) % tile.width;

		for( let x = start; x < width; x += tile.width ){

			ctx.drawImage( tile, x, y );

		}

	}

	function drawWater( top, time, offset ){

		ctx.fillStyle = COLORS.water;
		ctx.fillRect( 0, top, width, height - top );
		ctx.fillStyle = COLORS.waterDeep;
		ctx.fillRect( 0, top + 14, width, height - top - 14 );

		// Ripples drifting in alternating directions
		ctx.fillStyle = COLORS.waterLight;

		for( let i = 0, y = top + 4; y < height; i++, y += 5 ){

			const direction = i % 2 ? 1 : -1;
			const shift     = Math.floor( offset + direction * time * 6 + i * 9 );
			const start     = -( ( shift % 24 ) + 24 ) % 24;

			for( let x = start; x < width; x += 24 ){

				ctx.fillRect( x, y, 6 - ( i % 3 ), 1 );

			}

		}

		// Foam where the water meets the cliff
		const phase      = Math.floor( time * 3 ) % 2;
		const foamOffset = ( ( Math.floor( offset ) % 8 ) + 8 ) % 8;

		ctx.fillStyle = COLORS.foam;

		for( let x = -foamOffset; x < width; x += 8 ){

			ctx.fillRect( x + phase * 4, top, 4, 1 );
			ctx.fillRect( x + 1 + phase * 4, top + 1, 2, 1 );

		}

	}

	function draw( time ){

		const seconds = time / 1000;
		const { waterTop, cliffTop, grassTop, jungleTop, mountainTop } = layout();

		ctx.drawImage( sky, 0, 0 );

		for( const star of twinklers ){

			const glow = Math.sin( seconds * star.speed + star.phase );

			if( glow > -0.3 ){

				ctx.fillStyle = glow > 0.6 ? COLORS.star : COLORS.starDim;
				ctx.fillRect( star.x, star.y, 1, 1 );

			}

		}

		drawTiled( mountain, camera * 0.15, mountainTop );
		drawTiled( jungle, camera * 0.4, jungleTop );
		drawTiled( cliff, camera * 0.8, cliffTop );
		drawTiled( grass, camera * 0.8, grassTop );
		drawWater( waterTop, seconds, camera * 0.8 );

		// Cheat unlocked: three quick white flashes
		const sinceFlash = time - flashAt;

		if( sinceFlash >= 0 && sinceFlash < 360 && Math.floor( sinceFlash / 60 ) % 2 === 0 ){

			ctx.fillStyle = "rgba(252, 252, 252, 0.85)";
			ctx.fillRect( 0, 0, width, height );

		}

	}

	function tick( time ){

		frameId = requestAnimationFrame( tick );

		if( time - lastFrame < FRAME_TIME ){

			return;

		}

		const elapsed = lastFrame ? Math.min( time - lastFrame, 100 ) : 0; // Don't jump after the tab was hidden

		lastFrame = time;
		camera   += ( elapsed / 1000 ) * CAMERA_SPEED;

		draw( time );

	}

	function start(){

		cancelAnimationFrame( frameId );
		frameId   = null;
		lastFrame = 0;

		if( reduceMotion.matches ){

			draw( 0 );

		}else{

			frameId = requestAnimationFrame( tick );

		}

	}

	function resize(){

		const viewWidth  = window.innerWidth;
		const viewHeight = window.innerHeight;

		// Whole number scaling keeps every scene pixel the same size
		scale  = Math.max( 1, Math.min( Math.round( viewHeight / 240 ), Math.floor( viewHeight / MIN_HEIGHT ) ) );
		width  = Math.ceil( viewWidth / scale );
		height = Math.max( MIN_HEIGHT, Math.ceil( viewHeight / scale ) );

		canvas.width        = width;
		canvas.height       = height;
		canvas.style.width  = `${ width * scale }px`;
		canvas.style.height = `${ height * scale }px`;

		buildSky();
		draw( performance.now() );

	}

	let resizeFrame = null;

	window.addEventListener( "resize", () => {

		cancelAnimationFrame( resizeFrame );
		resizeFrame = requestAnimationFrame( resize );

	} );

	reduceMotion.addEventListener( "change", start );

	resize();
	start();

	window.pixelScene = {

		flash(){

			if( !reduceMotion.matches ){

				flashAt = performance.now();

			}

		}

	};

} )();
