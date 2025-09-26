// ==UserScript==
// @name         OnlyAppleCanDo
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  户晨风最喜欢的一集
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==


(function() {
	'use strict';

	const STORAGE_KEY = '__fakeTarget';
	let target = localStorage.getItem(STORAGE_KEY) || 'reset';

	Object.defineProperty(window, '户晨风', {
		configurable: true,
		set: function(val) {
			if (['macos', 'ios', 'ipados'].includes(val)) {
				localStorage.setItem(STORAGE_KEY, val);
				location.reload();
			} else if (val === 'reset') {
				localStorage.removeItem(STORAGE_KEY);
				location.reload();
			} else {
				console.warn('户晨风 只能设置 macos / ios / ipados / reset');
			}
		},
		get: function() {
			return localStorage.getItem(STORAGE_KEY) || target;
		}
	});

	let ua, platform, touchPoints = 0,
		coarse = false,
		hover = true,
		pwaStandalone = null,
		isMobile = false;

	if (!['macos', 'ios', 'ipados'].includes(target)) {
		console.log('不卡的安卓电脑。。。。');
		const interval = setInterval(() => {
			if (window.startWebGLExperience) {
				window.startWebGLExperience = function() {};
				clearInterval(interval);
			}
		}, 10);
		return;
	}

	if (target === 'macos') {
		ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 26_00_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
		platform = "MacIntel";
		touchPoints = 0;
		coarse = false;
		hover = true;
		isMobile = false;
		pwaStandalone = false;
	} else if (target === 'ios') {
		ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
		platform = "iPhone";
		touchPoints = 5;
		coarse = true;
		hover = false;
		isMobile = true;
		pwaStandalone = null;
	} else if (target === 'ipados') {
		ua = "Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
		platform = "MacIntel";
		touchPoints = 5;
		coarse = false;
		hover = true;
		isMobile = true;
		pwaStandalone = null;
	}


	Object.defineProperty(navigator, "userAgent", {
		get: () => ua
	});
	Object.defineProperty(navigator, "platform", {
		get: () => platform
	});
	Object.defineProperty(navigator, "maxTouchPoints", {
		get: () => touchPoints
	});
	Object.defineProperty(navigator, "pointer", {
		get: () => coarse ? "coarse" : "fine"
	});
	Object.defineProperty(navigator, "hover", {
		get: () => hover
	});
	Object.defineProperty(navigator, "standalone", {
		get: () => pwaStandalone
	});

	let screenShortSide;
	if (target === 'ios') {
		screenShortSide = 134;
		Object.defineProperty(screen, "width", {
			get: () => 2048
		});
		Object.defineProperty(screen, "height", {
			get: () => 1152
		});
		Object.defineProperty(window, "devicePixelRatio", {
			get: () => 3
		});
	} else if (target === 'ipados') {
		screenShortSide = 834;
	} else {
		screenShortSide = 921.6;
		Object.defineProperty(screen, "width", {
			get: () => 2048
		});
		Object.defineProperty(screen, "height", {
			get: () => 1152
		});
		Object.defineProperty(window, "devicePixelRatio", {
			get: () => 1.25
		});
	}

	const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
	WebGLRenderingContext.prototype.getParameter = function(p) {
		if (p === 37445) return "Apple Inc.";
		if (p === 37446) return "Apple GPU (Metal)";
		return originalGetParameter.call(this, p);
	};

	window.ApplePaySession = function() {};
	if (isMobile && typeof DeviceMotionEvent === "function") {
		DeviceMotionEvent.requestPermission = () => Promise.resolve("granted");
	}
	window.safari = target === 'macos' ? {
		pushNotification: {}
	} : {};

	const originalSupports = CSS.supports.bind(CSS);
	CSS.supports = function(prop, value) {
		if (isMobile && (prop === "-webkit-touch-callout" || prop === "-webkit-overflow-scrolling")) return true;
		return originalSupports(prop, value);
	};

	const originalCanPlayType = HTMLVideoElement.prototype.canPlayType;
	HTMLVideoElement.prototype.canPlayType = function(type) {
		if (type.includes("hevc")) return "probably";
		if (type.includes("vp9")) return "";
		return originalCanPlayType.call(this, type);
	};

	const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
	HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
		const ctx = this.getContext("2d");
		if (ctx) {
			const w = this.width,
				h = this.height;
			const imgData = ctx.getImageData(0, 0, w, h);
			for (let i = 0; i < imgData.data.length; i += 4) {
				imgData.data[i] ^= 0;
			}
			ctx.putImageData(imgData, 0, 0);
		}
		return originalToDataURL.call(this, type, quality);
	};

	if (target !== 'macos') {
		if (!('ontouchstart' in window)) {
			Object.defineProperty(window, 'ontouchstart', {
				value: null,
				configurable: true
			});
		}

		const fakeNavigator = new Proxy(navigator, {
			has(targetObj, key) {
				if (['serial', 'hid', 'usb', 'getInstalledRelatedApps'].includes(key)) return false;
				return Reflect.has(targetObj, key);
			},
			get(targetObj, key) {
				if (key === 'getInstalledRelatedApps') return undefined;
				if (['serial', 'hid', 'usb'].includes(key)) return undefined;
				if (key === 'pointer') return 'coarse';
				if (key === 'hover') return false;
				if (key === 'maxTouchPoints') return 5;
				if (key === 'standalone') return false;
				return Reflect.get(targetObj, key);
			},
			ownKeys(targetObj) {
				return Reflect.ownKeys(targetObj).filter(k => !['serial', 'hid', 'usb', 'getInstalledRelatedApps'].includes(k));
			},
			getOwnPropertyDescriptor(targetObj, key) {
				if (['serial', 'hid', 'usb', 'getInstalledRelatedApps'].includes(key)) return undefined;
				return Reflect.getOwnPropertyDescriptor(targetObj, key);
			}
		});

		Object.defineProperty(window, 'navigator', {
			get: () => fakeNavigator,
			configurable: true
		});
	} else {
		try {
			Object.defineProperty(navigator, 'standalone', {
				value: undefined,
				configurable: true
			});
		} catch (e) {}
		const fakeNavigator = new Proxy(navigator, {
			has(targetObj, key) {
				if (key === 'getInstalledRelatedApps') return false;
				return Reflect.has(targetObj, key);
			},
			get(targetObj, key) {
				if (key === 'getInstalledRelatedApps') return undefined;
				if (key === 'standalone') return undefined;
				return Reflect.get(targetObj, key);
			},
			ownKeys(targetObj) {
				return Reflect.ownKeys(targetObj).filter(k => k !== 'getInstalledRelatedApps' && k !== 'standalone');
			},
			getOwnPropertyDescriptor(targetObj, key) {
				if (key === 'getInstalledRelatedApps' || key === 'standalone') return undefined;
				return Reflect.getOwnPropertyDescriptor(targetObj, key);
			}
		});

		Object.defineProperty(window, 'navigator', {
			get: () => fakeNavigator,
			configurable: true
		});
	}

	const originalMatchMedia = window.matchMedia;
	window.matchMedia = function(query) {
		const lowerQuery = query.toLowerCase();

		if (lowerQuery.includes('pointer: coarse')) {
			return Object.assign(originalMatchMedia.call(window, query), {
				matches: coarse
			});
		}
		if (lowerQuery.includes('pointer: fine')) {
			return Object.assign(originalMatchMedia.call(window, query), {
				matches: !coarse
			});
		}
		if (lowerQuery.includes('hover: hover')) {
			return Object.assign(originalMatchMedia.call(window, query), {
				matches: hover
			});
		}
		if (lowerQuery.includes('hover: none')) {
			return Object.assign(originalMatchMedia.call(window, query), {
				matches: !hover
			});
		}
		if (lowerQuery.includes('any-pointer: coarse')) {
			return Object.assign(originalMatchMedia.call(window, query), {
				matches: coarse
			});
		}
		if (lowerQuery.includes('any-pointer: fine')) {
			return Object.assign(originalMatchMedia.call(window, query), {
				matches: !coarse
			});
		}

		return originalMatchMedia.call(window, query);
	};

	//isApplePlatform
	Object.defineProperty(window, "isApplePlatform", {
		value: () => true,
		configurable: true
	});

	//applesignal
	const appleSignalSnapshot = {
		basic: {
			touchPoints,
			coarse,
			fine: !coarse,
			hover
		},
		apple: {
			webkitTouchCallout: isMobile,
			webkitOverflowScrolling: isMobile,
			applePay: true,
			safariPush: target === 'macos',
			iOSPermissionShape: isMobile,
			pwaStandalone
		},
		android: {
			webNFC: false,
			nfcDetails: "",
			relatedApps: false
		},
		desktop: {
			webSerial: target === 'macos',
			webHID: target === 'macos',
			webUSB: target === 'macos'
		},
		display: {
			dpr: target === 'macos' ? 1.25 : 3,
			screen: [2048, 1152],
			shortSideCSS: screenShortSide
		},
		security: {
			isSecureContext: true,
			protocol: location.protocol
		},
		webgl: {
			vendor: "Apple Inc.",
			renderer: "Apple GPU (Metal)"
		},
		media: {
			hevc: true,
			vp9: false
		},
		nfc: {
			hasAPI: false,
			apiType: "",
			canScan: false,
			error: null
		}
	};
	Object.defineProperty(window, "getSignalSnapshot", {
		get: () => appleSignalSnapshot,
		configurable: true
	});

    const fakeUAData = {
        mobile: isMobile,
        platform: (target === 'macos' ? 'macOS' : (target === 'ios' ? 'iOS' : 'iPadOS')),
        brands: [
            { brand: "Chromium", version: "117" },
            { brand: "Safari", version: "17" },
            { brand: "Not=A?Brand", version: "99" }
        ],
        getHighEntropyValues: async (hints) => {
            const result = {};
            for (const hint of hints) {
                switch (hint) {
                    case 'platform':
                        result.platform = fakeUAData.platform;
                        break;
                    case 'platformVersion':
                        result.platformVersion = (target === 'macos' ? "26.0.0" : "26.0.0");
                        break;
                    case 'architecture':
                        result.architecture = "arm";
                        break;
                    case 'model':
                        result.model = (target === 'ios' ? "iPhone26" : (target === 'ipados' ? "iPad26" : ""));
                        break;
                    case 'uaFullVersion':
                        result.uaFullVersion = "117.0.0.0";
                        break;
                }
            }
            return result;
        }
    };

    Object.defineProperty(navigator, "userAgentData", {
        get: () => fakeUAData,
        configurable: true
    });

	console.log("Fake Apple: ", target);

})();
