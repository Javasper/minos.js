/*! MIT License © Sindre Sorhus */
(function(){
const isObject = value => value !== null && typeof value === 'object';
const supportsAbortController = typeof globalThis.AbortController === 'function';
const supportsStreams = typeof globalThis.ReadableStream === 'function';
const supportsFormData = typeof globalThis.FormData === 'function';

const mergeHeaders = (source1, source2) => {
 
	const result = new globalThis.Headers(source1 || {});
	const isHeadersInstance = source2 instanceof globalThis.Headers;
	const source = new globalThis.Headers(source2 || {});
 

	for (const [key, value] of source) {
	 
	
		if ((isHeadersInstance && value === 'undefined') || value === undefined) {
			result.delete(key);
		} else {
			result.set(key, value);
		}
	}


/*result just a blank header*/ 

	return result;
};

const deepMerge = (...sources) => {
 
	let returnValue = {};
	let headers = {};
 
	for (const source of sources) {
		if (Array.isArray(source)) {
			if (!(Array.isArray(returnValue))) {
				returnValue = [];
			}

			returnValue = [...returnValue, ...source];
		} else if (isObject(source)) {
			for (let [key, value] of Object.entries(source)) {

				if (isObject(value) && (key in returnValue)) {
		
					value = deepMerge(returnValue[key], value);
				}

				returnValue = {...returnValue, [key]: value};
			}

			if (isObject(source.headers)) {

				headers = mergeHeaders(headers, source.headers);
			}
		}

		returnValue.headers = headers;
	}
 
	return returnValue;
};

const requestMethods = [
	'get',
	'post',
	'put',
	'patch',
	'head',
	'delete'
];

const responseTypes = {
	json: 'application/json',
	text: 'text/*',
	formData: 'multipart/form-data',
	arrayBuffer: '*/*',
	blob: '*/*'
};

const retryMethods = [
	'get',
	'put',
	'head',
	'delete',
	'options',
	'trace'
];

const retryStatusCodes = [
	408,
	413,
	429,
	500,
	502,
	503,
	504
];

const retryAfterStatusCodes = [
	413,
	429,
	503
];

const stop = Symbol('stop');

class HTTPError extends Error {
	constructor(response, request, options) {
		// Set the message to the status text, such as Unauthorized,
		// with some fallbacks. This message should never be undefined.
		super(
			response.statusText ||
			String(
				(response.status === 0 || response.status) ?
					response.status : 'Unknown response error'
			)
		);
		this.name = 'HTTPError';
		this.response = response;
		this.request = request;
		this.options = options;
	}
}

class TimeoutError extends Error {
	constructor(request) {
		super('Request timed out');
		this.name = 'TimeoutError';
		this.request = request;
	}
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// `Promise.race()` workaround (#91)
const timeout = (request, abortController, options) =>
/*inputting this.options....and this.options =options*/
	new Promise((resolve, reject) => {
 

		/* eslint-disable promise/prefer-await-to-then */
		options.fetch(request)
			.then(resolve)
			.catch(reject)
			 ;
		/* eslint-enable promise/prefer-await-to-then */
	});

const normalizeRequestMethod = input => requestMethods.includes(input) ? input.toUpperCase() : input;

 
// The maximum value of a 32bit int (see issue #117)
const maxSafeTimeout = 2147483647;

class Minos {
	constructor(input, options = {}) {

		this._retryCount = 0;
		this._input = input;
 
	

		this._options = {
			// TODO: credentials can be removed when the spec change is implemented in all browsers. Context: https://www.chromestatus.com/feature/4539473312350208
			credentials: this._input.credentials || 'same-origin',
			...options,
			headers: mergeHeaders(this._input.headers, options.headers),
			hooks: deepMerge({
				beforeRequest: [],
				beforeRetry: [],
				afterResponse: []
			}, options.hooks),
			method: normalizeRequestMethod(options.method || this._input.method),
			prefixUrl: String(options.prefixUrl || ''),
	 
			throwHttpErrors: options.throwHttpErrors !== false,
			timeout: typeof options.timeout === 'undefined' ? 10000 : options.timeout,
			fetch:   globalThis.fetch.bind(globalThis)
		};
  

	


 if (typeof this._input !== 'string' && !(this._input instanceof URL || this._input instanceof globalThis.Request)) {
			throw new TypeError('`input` must be a string, URL, or Request');
		}
  
		if (this._options.prefixUrl && typeof this._input === 'string') {
			if (this._input.startsWith('/')) {
				throw new Error('`input` must not begin with a slash when using `prefixUrl`');
			}

			if (!this._options.prefixUrl.endsWith('/')) {
				this._options.prefixUrl += '/';
			}

			this._input = this._options.prefixUrl + this._input;
		}
 
		this.request = new globalThis.Request(this._input, this._options);
 
		
		

		if (this._options.json !== undefined) {
			this._options.body = JSON.stringify(this._options.json);
			this.request.headers.set('content-type', 'application/json');
			this.request = new globalThis.Request(this.request, {body: this._options.body});
		}

		const fn = async () => {
            
			let response = await this._fetch(); /*this line gives you the response and you need to look at the fetch function to find out more*/

			return response;
		};
	
	 
		const result =   fn();
 
		for (const [type, mimeType] of Object.entries(responseTypes)) {
			result[type] = async () => {
				this.request.headers.set('accept', this.request.headers.get('accept') || mimeType);

				const response = (await result).clone();
 
				if (type === 'json') {
					if (response.status === 204) {
						return '';
					}

					if (options.parseJson) {
						return options.parseJson(await response.text());
					}
				}

				return response[type]();
			};
		}

		return result;
	}
 

	_decorateResponse(response) {
     
       
/*looks like parseJSON does not exist because it is undefined */
		if (this._options.parseJson) {

  
			response.json = async () => {
				return this._options.parseJson(await response.text());
			};
		}

		return response;
	}
 

	async _fetch() {
 
 		return timeout(this.request.clone(), this.abortController, this._options);
	}

	/* istanbul ignore next */ 
}

const validateAndMerge = (...sources) => {
   
	for (const source of sources) {
		if ((!isObject(source) || Array.isArray(source)) && typeof source !== 'undefined') {
			throw new TypeError('The `options` argument must be an object');
		}
	} 
	return deepMerge({}, ...sources);
};

const createInstance = defaults => {
/*defaults, options, are undefined here*/ 
	const minos = (input, options) => new minos(input, validateAndMerge(defaults, options));

	for (const method of requestMethods) {
	
	 
		minos[method] = (input, options) => new Minos(input, validateAndMerge(defaults, options, {method}));
	}
 
	minos.HTTPError = HTTPError;
	minos.TimeoutError = TimeoutError;
	minos.create = newDefaults => createInstance(validateAndMerge(newDefaults));
	minos.extend = newDefaults => createInstance(validateAndMerge(defaults, newDefaults));
	minos.stop = stop;

	return minos;
};

minos = createInstance();
})()
