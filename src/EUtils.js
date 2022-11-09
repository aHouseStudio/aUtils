(() => {
	class EUtilsManager {
		constructor() {
			// Object storing all color objects being transitioned at the moment
			this.transitions = {};
			// An array storing all the taken unique IDS
			this.storedIDs = [];
			// The version of this library
			this.version = '1.0.0';
		}
		decimalRand(pNum1, pNum2, pPlaces = 1) {
			const result = Number((Math.random() * (pNum1 - pNum2) + pNum2).toFixed(pPlaces));
			return (result >= 1 ? Math.floor(result) : result);
		}
		getPercentage(pValue, pTotalValue) {
			return (100 * pValue) / pTotalValue;
		}
		clamp(a, min = 0, max = 1) {
			return Math.min(max, Math.max(min, a));
		}
		lerp(x, y, a) {
			return x * (1 - a) + y * a;
		}
		flooredLerp(x, y, a) {
			return Math.floor(this.lerp(x, y, a));
		}
		round(pNumber, pPlace=1) {
			return Math.round(pPlace * pNumber) / pPlace;
		}
		normalize(pVal, pMin, pMax) {
			if (pMax - pMin === 0) return 1;
			return (pVal - pMin) / (pMax - pMin);
		}
		within(pVal, pMin, pMax) {
			return pVal >= pMin && pVal <= pMax;
		}
		// Splits the number by their correct separators // 235235236523 = 235,235,236,523
		formatNumber(pNum) {
			return pNum.toFixed().toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
		}
		// Generate a unique id
		generateID(pID = 7) {
			const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
			const makeID = function() {
				let ID = '';
				for (let i = 0; i < pID; i++) {
					ID += chars.charAt(Math.floor(Math.random() * chars.length));
				}
				return ID;
			}
			let ID = makeID();
			while(this.storedIDs.includes(ID)) {
				ID = makeID();
			}
			this.storedIDs.push(ID);
			return ID;
		}
		decimalToHex(pDecimal, pChars = 6) {
			return '#' + (pDecimal + Math.pow(16, pChars)).toString(16).slice(-pChars).toUpperCase();
		}
		// Add intensity to this color to get a brighter or dimmer effect
		addIntensity(pColor, pPercent) {
			const rgb = this.grabColor(pColor).rgbArray;
			const r = rgb[0];
			const g = rgb[1];
			const b = rgb[2];
			let rr = 0;
			let rg = 0;
			let rb = 0;
			const black = (r === 0 && g === 0 && b === 0) ? true : false;
			if (r || black) rr = r + Math.floor((255 * pPercent) / 100);
			if (g || black) rg = g + Math.floor((255 * pPercent) / 100);
			if (b || black) rb = b + Math.floor((255 * pPercent) / 100);
			return this.grabColor(this.clamp(rr, 0, 255), this.clamp(rg, 0, 255), this.clamp(rb, 0, 255)).hex
		}
		// Convert a color to different formats or get a random color
		grabColor(pSwitch = this.getRandomColor(), g, b) {
			let hex, cr, cg, cb;
			if (typeof(pSwitch) === 'number' && typeof(g) === 'number' && typeof(b) === 'number') {
				cr = this.clamp(pSwitch, 0, 255);
				cg = this.clamp(g, 0, 255);
				cb = this.clamp(b, 0, 255);
				const craftString = function(pColor) {
					return pColor.toString(16).padStart(2, '0');
				}
				hex = '#' + [cr, cg, cb].map(craftString).join('');
			} else {
				if (typeof(pSwitch) === 'number') {
					pSwitch = this.decimalToHex(pSwitch);
				}
				hex = pSwitch;
				pSwitch = pSwitch.replace('#', '');
				if (pSwitch.length === 3) {
					pSwitch = pSwitch.replace(new RegExp('(.)', 'g'), '$1$1');
				}
				pSwitch = pSwitch.match(new RegExp('..', 'g'));
				cr = this.clamp(parseInt(pSwitch[0], 16), 0, 255);
				cg = this.clamp(parseInt(pSwitch[1], 16), 0, 255);
				cb = this.clamp(parseInt(pSwitch[2], 16), 0, 255);
			}
			return { 'hex': hex.toLowerCase(), 'hexTagless': hex.replace('#', '').toLowerCase(), 'rgb': 'rgb('+cr+','+cg+','+cb+')', 'rgbArray': [cr, cg, cb], 'rgbObject': { 'r': cr, 'g': cg, 'b': cb }, 'rgbNormal': [Math.round(cr/255 * 100) / 100, Math.round(cg/255 * 100) / 100, Math.round(cb/255 * 100) / 100], 'decimal': (cr << 16 | cg << 8 | cb) };
		}
		getRandomColor() {
			const chars = '0123456789ABCDEF';
			let color = '#';
			for (let i = 0; i < 6; i++) {
				color += chars[Math.floor(Math.random() * 16)];
			}
			return color;
		}
		getRandomColorBetween(u = Math.random(), c1, c2) {
			return this.flooredLerp(u, c1, c2);
		}
		// Transition a color to another color in pDuration time.
		transitionColor(pInstance, pStartColor='#000', pEndColor='#fff', pDuration=1000, pIterativeCallback, pEndCallback) {
			// Cannot use this API on the server
			if (!globalThis.window) return;
			const INTERVAL_RATE = 1000/60;
			const iterations = pDuration / INTERVAL_RATE;
			const iterativeCallback = typeof(pIterativeCallback) === 'function' ? pIterativeCallback : null;
			const endCallback = typeof(pEndCallback) === 'function' ? pEndCallback : null;
			let id;
			let isParticle;
			let isTintObject;
	
			let rgbStartColor;
			let rgbEndColor;
	
			if (pInstance) {
				id = pInstance.id ? pInstance.id : this.generateID();
				isParticle = (pInstance.type === 'GeneratedParticle');
				isTintObject = (typeof(pInstance.color) === 'object' && pInstance.color.constructor === Object ? true : false);
				if (this.transitions[id]) this.cancelTransitionColor(id);
			} else {
				id = this.generateID();
			}
				
			this.transitions[id] = {
				'rate': 1 / iterations,
				'counter': 0,
				'timeTracker': isParticle ? pInstance.info.lifetime : 0
			};
	
			rgbStartColor = this.grabColor(pStartColor).rgbArray;
			rgbEndColor = this.grabColor(pEndColor).rgbArray;
	
			const self = this;
			this.transitions[id].step = (pTimeStamp) => {
				if (self.transitions[id]) {
					if (isParticle) {
						if (pInstance.info) {
							if (pInstance.info.owner) {
								if (pInstance.info.owner.settings.paused) {
									return;
								}
							}
						} else {
							if (self.transitions[id]) this.cancelTransitionColor(id);
							return;				
						}
					}
	
					const now = performance.now();
					if (!self.transitions[id].lastTime) self.transitions[id].lastTime = now;
					const elapsed = now - self.transitions[id].lastTime;
					// The max value of counter is 1, so we clamp it at 1
					self.transitions[id].counter = Math.min(self.transitions[id].counter + self.transitions[id].rate, 1);
					// Time tracker is used rather than lastStamp - startStamp because this currently takes into account particles passed in (this will be removed in the future and use the former method)
					self.transitions[id].timeTracker += elapsed;
					
					const r = parseInt(self.lerp(rgbStartColor[0], rgbEndColor[0], self.transitions[id].counter), 10);
					const g = parseInt(self.lerp(rgbStartColor[1], rgbEndColor[1], self.transitions[id].counter), 10);
					const b = parseInt(self.lerp(rgbStartColor[2], rgbEndColor[2], self.transitions[id].counter), 10);
					const color = self.grabColor(r, g, b);
	
					if (iterativeCallback) iterativeCallback(color);
	
					if (pInstance) {
						if (isTintObject) {
							pInstance.color.tint = color.decimal;
							pInstance.color = pInstance.color;
						} else {
							pInstance.color = color.hex;
						}
					}
	
					if (self.transitions[id].counter >= 1 || self.transitions[id].timeTracker >= pDuration) {
						if (self.transitions[id]) this.cancelTransitionColor(id);
						if (endCallback) endCallback(color);
						return;
					}
					self.transitions[id].req = globalThis.requestAnimationFrame(self.transitions[id].step);
					self.transitions[id].lastTime = now;
				}
			}
	
			this.transitions[id].req = globalThis.requestAnimationFrame(this.transitions[id].step);
			return id;
		}
		cancelTransitionColor(pID) {
			if (this.transitions[pID]) {
				globalThis.cancelAnimationFrame(this.transitions[pID].req);
				delete this.transitions[pID];
			}
		}
		getPointRotated(pRect, pTheta, pPoint) {
			// cx, cy - center of square coordinates
			// x, y - coordinates of a corner point of the square
			// theta is the angle of rotation
	
			const cx = pRect.x + pRect.width / 2;
			const cy = pRect.y + pRect.height / 2;
	
			// translate point to origin
			const tempX = pPoint.x - cx;
			const tempY = pPoint.y - cy;
	
			// now apply rotation
			const rotatedX = tempX*Math.cos(pTheta) - tempY*Math.sin(pTheta);
			const rotatedY = tempX*Math.sin(pTheta) + tempY*Math.cos(pTheta);
	
			// translate back
			const x = rotatedX + cx;
			const y = rotatedY + cy;
			return { 'x': x, 'y': y };
		}
		getPointsOfRotatedRect(pRect, pTheta) {
			const tl = this.getPointRotated(pRect, pTheta, { 'x': pRect.x, 'y': pRect.y });
			const tr = this.getPointRotated(pRect, pTheta, { 'x': pRect.x + pRect.width, 'y': pRect.y });
			const bl = this.getPointRotated(pRect, pTheta, { 'x': pRect.x, 'y': pRect.y + pRect.height });
			const br = this.getPointRotated(pRect, pTheta, { 'x': pRect.x + pRect.width, 'y': pRect.y + pRect.height });
			const center = this.getPointRotated(pRect, pTheta, { 'x': pRect.x + pRect.width / 2, 'y': pRect.y + pRect.height / 2 });
			return { 'tl': tl, 'tr': tr, 'bl': bl, 'br': br, 'center': center };
		}
	}
	const EUtils = new EUtilsManager();
	if (typeof(VYLO) !== 'undefined') VYLO.global.EUtils = EUtils;
	globalThis.EUtils = EUtils;
	console.log("%cEUtils.js: ✅ EUtils.js@" + EUtils.version, "font-family:arial;");	
})();