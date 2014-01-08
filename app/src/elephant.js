/**
 * ElephantJS - Smart client side data objects manager
 * @version 0.1.0
 * @author Nir Elbaz
 * @requires _ http://lodash.com
 */

/**
 * @namespace
 */
var ElephantJS = (function () {
	'use strict';

	/**
	 * Default settings
	 * @type {{format: string, async: boolean, timeout: number, endpoint: string, cacheable: boolean, method: string, expires: number, success: Array, error: Array, complete: Array, process: null}}
	 * @private
	 */
	var _defaults = {
			'format': 'text',	// The type of the expected output. Can be text, xml or json
			'async': true,		// If you need synchronous requests, set this option to false
			'timeout': 30000,	// Set a timeout (in milliseconds) for the request
			'endpoint': '',		// Set an entry endpoint for a store / query
			'cacheable': true,	// If set to false, it will force queries to get data from server on every execution
			'method': 'GET',	// HTTP request method
			'expires': 300000,	// Set an expiration date (in milliseconds) for a query results in case it is cacheable
			'success': [],		// One or more functions to be called if the request succeeds
			'error': [],		// One or more functions to be called if the request failed
			'complete': [],		// One or more functions to be called after either success or error callbacks
			'process': null		// A function to be called if the request succeeds in order to manipulate output
		},
		/**
		 * Master collection of all stores (singleton)
		 * @type {Storage}
		 * @private
		 */
		storage;

	// <editor-fold desc="Objects">
	/**
	 * A parent object
	 * @class Core
	 * @property {String} strID Object unique id
	 * @property {Object} [objSettings] Object settings
	 * @returns {Core}
	 * @constructor
	 */
	function Core (strID, objSettings) {
		if (!_.isString(strID) || _.isEmpty(strID)) throw 'Object id is illegal';
		if (objSettings === undefined) objSettings = {};
		if (!_.isPlainObject(objSettings)) throw 'Settings are illegal';

		this.id = strID.toString();
		this.settings = _.defaults(objSettings, _defaults);
		this.items = [];

		return this;
	}
	Core.prototype = {
		/**
		 * Adds a new object to items collection
		 * @param {Object} objItem Object to add
		 */
		addItem: function (objItem) {
			if (!_.isObject(objItem)) throw 'Object is illegal';

			// Add object to items collection:
			if (this.itemExists(objItem) === false) {
				this.items.push(objItem);
				console.log('Item "%s" added to collection', objItem.id);
				return true;
			}
			else {
				throw 'Item already exists';
			}
		},

		/**
		 * Removes all items in an object's collection
		 * @returns {Integer} Number of items in collection
		 */
		removeAllItems: function () {
			this.items = [];
			return 0;
		},

		/**
		 * Removes specific item from an object's collection
		 * @param strID {String} id Object id to remove
		 * @returns {Boolean} True if object removed successfully, false otherwise.
		 */
		removeItem: function (strID) {
			if (!_.isString(strID) || _.isEmpty(strID)) throw 'Object id is illegal';

			var intCurrentCount = this.countItems(),
				intNewCount;

			this.items = _.reject(this.items, { "id": strID });
			intNewCount = this.countItems();

			if (intCurrentCount > intNewCount) {
				console.log('Object "%s" removed from collection', strID);
				return true;
			}
			else {
				console.warn('Object "%s" hasn\'t been removed from collection (does it exist?)', strID);
				return false;
			}
		},

		/**
		 * Returns number of items in an object
		 * @returns {Number}
		 */
		countItems: function () {
			return this.items.length;
		},

		/**
		 * Returns an item from a collection
		 * @param strProperty {String} property Property to search by
		 * @param objValue {String} value Value to search
		 * @returns {Object}
		 */
		getItem: function (strProperty, objValue) {
			if (!_.isString(strProperty) || _.isEmpty(strProperty)) throw 'Property is illegal';

			return _.find(this.items, function(item) {
				return JSON.stringify(item[strProperty]) === JSON.stringify(objValue);
			});
		},

		/**
		 * Checks if an item exists in a collection
		 * @param {Object} objItem Object to check
		 * @returns {Boolean|boolean} True if exists, false otherwise
		 */
		itemExists: function (objItem) {
			if (!_.isObject(objItem)) throw 'Object is illegal';

			return _.some(this.items, objItem);
		}
	};

	/**
	 * An object in which stores are stored and share the same settings
	 * @class Storage
	 * @extends Core
	 * @constructor
	 */
	function Storage () {
		// Call parent's constructor:
		Core.call(this, 'ElephantJS', {});
	}
	Storage.prototype = _.create(Core.prototype, { 'constructor': Storage });

	/**
	 * An object in which queries are stored and share the same settings
	 * @class Store
	 * @param {String} strName
	 * @param {Object} objSettings
	 * @extends Core
	 * @constructor
	 */
	function Store (strName, objSettings) {
		// Call parent's constructor:
		Core.call(this, strName, objSettings);
	}
	Store.prototype = _.create(Core.prototype, { 'constructor': Store });

	/**
	 * An object in which records are stored and share the same settings
	 * @class Query
	 * @param {String} strName
	 * @param {Object} objSettings
	 * @extends Core
	 * @constructor
	 */
	function Query (strName, objSettings) {
		// Call parent constructor:
		Core.call(this, strName, objSettings);
	}
	Query.prototype = _.create(Core.prototype, { 'constructor': Query });
	Query.prototype.executeQuery = function (objRecord, objSettings) {
		// Settings given to execution are temporary and serve only the current execution:
		var objTempSettings = _.defaults(objSettings, this.settings);
		try {
			objTempSettings.endpoint = _.template(objTempSettings.endpoint, objRecord.params);
		}
		catch (e) {
			throw 'Missing endpoint parameters';
		}

		// Check if there is already record with the same parameters:
		if (this.settings.cacheable === true) {
			var objExistingRecord = this.getItem('params', objRecord.params);
			if (_.isEmpty(objExistingRecord) === false) {
				// Check if cached item is still valid:
				if (_.now() - objExistingRecord.timestamps.received < this.settings.expires) {
					console.log('Serving item from cache...');
					var callbacks = objTempSettings.success;

					// Add success function callback to array if there is only one function
					if (typeof(callbacks) === 'function') {
						callbacks = [callbacks];
					}

					// Execute all success callbacks:
					for (var i = 0, length = callbacks.length; i < length; i++) {
						if (typeof(callbacks[i]) === 'function') {
							callbacks[i](objExistingRecord.output);
						}
					}
				}
				else {
					// Remove deprecated item and get an up-to-date record:
					this.removeItem(objExistingRecord.id);
					executeXHR.call(this, objRecord, objTempSettings);
				}
			}
			else {	// No such record, execute AJAX
				executeXHR.call(this, objRecord, objTempSettings);
			}
		}
		else {	// Query is not cacheable
			executeXHR.call(this, objRecord, objTempSettings);
		}

		function executeXHR(objRecord, objSettings) {
			var self = this,
				xhr = new XHR(_.defaults(objSettings, this.settings), objRecord.params);

			objRecord.timestamps.sent = _.now();
			xhr.execute(
				// Success callbacks:
				function (response) {
					var callbacks = objSettings.success,
						process = objSettings.process,
						output;

					switch (objSettings.format) {
						case 'json':
							output = JSON.parse(response.responseText);
							break;
						case 'xml':
							output = response.responseXML;
							break;
						default:
							output = response.responseText;
							break;
					}

					// Manipulate output if process callback is defined
					if (typeof(process) === 'function') {
						output = process(output);
					}
					// Add record object to the query object:
					objRecord.output = output;
					self.addItem(objRecord);

					// Add success function callback to array if there is only one function
					if (typeof(callbacks) === 'function') {
						callbacks = [callbacks];
					}

					// Execute all success callbacks:
					for (var i = 0, length = callbacks.length; i < length; i++) {
						if (typeof(callbacks[i]) === 'function') {
							callbacks[i](objRecord.output);
						}
					}
				},
				// Error callbacks:
				function (response) {
					var callbacks = objSettings.error;
					if (typeof(callbacks) === 'function') {
						callbacks = [callbacks];
					}

					// Remove record:
					objRecord = null;

					// Execute all success callbacks:
					for (var i = 0, length = callbacks.length; i < length; i++) {
						if (typeof(callbacks[i]) === 'function') {
							callbacks[i](response);
						}
					}
				},
				// Complete callbacks:
				function (response) {
					objRecord.timestamps.received = _.now();

					var callbacks = objSettings.complete;
					if (typeof(callbacks) === 'function') {
						callbacks = [callbacks];
					}

					for (var i = 0, length = callbacks.length; i < length; i++) {
						if (typeof(callbacks[i]) === 'function') {
							callbacks[i](response);
						}
					}
				});
		}
	};

	/**
	 * An object in which single data object is stored
	 * @class Record
	 * @param {Object} objParams Collection of parameters which for current record
	 * @param {Object} objOutput Data object returned after execution
	 * @extends Core
	 * @constructor
	 */
	function Record (objParams, objOutput) {
		this.id = _.uniqueId();
		this.timestamps = {
			created: _.now(),
			sent: null,
			received: null
		};
		this.params = objParams;
		this.output = objOutput;
	}
	// </editor-fold>

	// <editor-fold desc="XHR">
	var XHR = function (objSettings, objParams) {
		this.xhr = null;
		this.params = objParams;
		this.settings = {
			async: true,
			endpoint: '',
			timeout: null,
			method: 'GET'
		};

		this.init(objSettings);
	};
	XHR.prototype = (function() {
			var serialize = function(objParams) {
				var str = [];

				for(var param in objParams)
					if (objParams.hasOwnProperty(param)) {
						str.push(encodeURIComponent(param) + "=" + encodeURIComponent(objParams[param]));
					}
				return str.join("&");
			},

			execute = function (fncSuccess, fncError, fncComplete) {
				if (this.xhr !== undefined && this.endpoint !== '') {
					var strParams = serialize(this.params);

					// Synchronous requests must not set a timeout:
					if (this.settings.async === true)
						this.xhr.timeout = this.settings.timeout;
					// Set callback
					this.xhr.onreadystatechange = function () {
						switch (this.readyState) {
//							case 0:		// Object created
//								console.log('Object created');
//								break;
//							case 1:		// Object opened
//								console.log('Object opened');
//								break;
//							case 2:		// Object sent, headers returned
//								console.log('Object sent, headers returned');
//								break;
//							case 3:		// Request in progress, body partially returned
//								console.log('Request in progress, body partially returned');
//								break;
							case 4:		// Request completed
								console.log('Request completed');
								// Success
								if (this.status >= 200 && this.status <= 299) {
									if (typeof(fncSuccess) === 'function') {
										fncSuccess(this);
									}
								}
								// Error
								else {
									if (typeof(fncError) === 'function') {
										fncError(this);
									}
								}
								// Complete
								if (typeof(fncComplete) === 'function') {
									fncComplete(this);
								}
								break;
						}
					};

					switch (this.settings.method) {
						case 'POST':
							this.xhr.open(this.settings.method, this.settings.endpoint, this.settings.async);
							this.xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
							this.xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
							this.xhr.setRequestHeader('Connection', 'close');
							this.xhr.send(strParams);
							break;
						default:
							var strEndpoint = this.settings.endpoint;
							if (strParams !== '' && strEndpoint.indexOf(strParams) < 0) {
								if (strEndpoint.indexOf('?') >= 0) {
									strEndpoint += '&' + strParams;
								}
								else {
									strEndpoint += '?' + strParams;
								}
							}
							this.xhr.open(this.settings.method, strEndpoint, this.settings.async);
							this.xhr.send();
							break;
					}
				}
			},

			createXHR = function () {
				var objXHR = null;

				if (XMLHttpRequest) {
					try { objXHR = new XMLHttpRequest(); }
					catch (e) { objXHR = null; }
				}
				else {
					if(typeof window.ActiveXObject !== 'undefined') {
						try { objXHR = new window.ActiveXObject("Msxml2.XMLHTTP"); }
						catch (e) {
							try { objXHR = new window.ActiveXObject("Microsoft.XMLHTTP"); }
							catch (e1) {
								objXHR = false;
								throw new Error("This browser does not support XMLHttpRequest");
							}
						}
					}
				}

				return objXHR;
			},

			init = function (settings) {
				if (this.xhr === null) {
					// Create a new XHR object:
					this.xhr = createXHR();
					this.settings = settings;
				}
			};

		return {
			execute: execute,
			init: init
		};
	})();
	// </editor-fold>

	// <editor-fold desc="Methods">
	/**
	 * Validate object settings
	 * @param settings
	 */
	function validateSettings(settings) {
		if (typeof(settings) !== 'object') throw 'Settings are invalid';
		var i, length;

		for(var item in settings) {
			if (settings.hasOwnProperty(item)) {
				switch (item) {
					case 'async':
						if(_.isBoolean(settings[item]) === false)
							throw 'Settings are illegal: "async" must be a boolean';
						break;
					case 'format':
						if(/xml|text|json|html/.test(settings[item]) === false)
							throw 'Settings are illegal: "format" must be a either xml, json, html or text';
						break;
					case 'timeout':
						if(_.isNumber(settings[item]) === false)
							throw 'Settings are illegal: "timeout" must be a positive integer';
						break;
					case 'endpoint':
						if(_.isString(settings[item]) === false)
							throw 'Settings are illegal: "endpoint" must be a string';
						break;
					case 'cacheable':
						if(_.isBoolean(settings[item]) === false)
							throw 'Settings are illegal: "cacheable" must be a boolean';
						break;
					case 'expires':
						if(_.isNumber(settings[item]) === false)
							throw 'Settings are illegal: "expires" must be a positive integer';
						break;
					case 'method':
						if(/GET|POST/.test(settings[item]) === false)
							throw 'Settings are illegal: "method" must be a either GET or POST';
						break;
					case 'process':
						if(_.isFunction(settings[item]) === false)
							throw 'Settings are illegal: "process" callback must be a function';
						break;
					case 'success':
						if(_.isArray(settings[item]) === false) {
							if(_.isFunction(settings[item]) === false)
								throw 'Settings are illegal: "success" callbacks must be a function or an array of functions';
						}
						else {
							for (i = 0, length = settings[item].length; i < length; i++) {
								if(_.isFunction(settings[item][i]) === false)
									throw 'Settings are illegal: "success" callbacks must be a function or an array of functions';
							}
						}
						break;
					case 'error':
						if(_.isArray(settings[item]) === false) {
							if(_.isFunction(settings[item]) === false)
								throw 'Settings are illegal: "error" callbacks must be a function or an array of functions';
						}
						else {
							for (i = 0, length = settings[item].length; i < length; i++) {
								if(_.isFunction(settings[item][i]) === false)
									throw 'Settings are illegal: "error" callbacks must be a function or an array of functions';
							}
						}
						break;
					case 'complete':
						if(_.isArray(settings[item]) === false) {
							if(_.isFunction(settings[item]) === false)
								throw 'Settings are illegal: "complete" callbacks must be a function or an array of functions';
						}
						else {
							for (i = 0, length = settings[item].length; i < length; i++) {
								if(_.isFunction(settings[item][i]) === false)
									throw 'Settings are illegal: "complete" callbacks must be a function or an array of functions';
							}
						}
						break;
				}
			}

		}
	}

	/**
	 * Counts all stores in storage
	 * @returns {Number} Number of stores
	 */
	function countStores () {
		return (storage.countItems());
	}

	/**
	 * Creates a new store in which data objects and queries are stored and share the same settings.
	 * @param strID {String} id New store id
	 * @param objSettings {Object} settings New store settings. Will be used as default settings for all of its items
	 */
	function createStore (strID, objSettings) {
		if (!_.isString(strID) || _.isEmpty(strID)) throw 'Store id is illegal';
		if (objSettings === undefined) objSettings = {};
		if (!_.isPlainObject(objSettings)) throw 'Settings are illegal';

		// Validate settings:
		validateSettings(objSettings);
		// Create a new store:
		var store = new Store(strID, objSettings);
		storage.addItem(store);
	}

	/**
	 * Removes an existing store totally, including its settings, queries & data objects
	 * @param strID {String} id Store id to remove
	 */
	function destroyStore (strID) {
		//try {
			storage.removeItem(strID);
		//} catch (e) {
		//	console.error(e);
		//}
	}

	/**
	 * Removes all stores totally, including its settings, queries & data objects
	 */
	function destroyAll () {
		storage.removeAllItems();
	}

	/**
	 * Adds a new query to a store
	 * @param {String} strStoreID Store id to which to add the new query
	 * @param {String} strID New query id
	 * @param {Object} objSettings New query settings. Will be used as default settings for all of its items
	 */
	function registerQuery (strStoreID, strID, objSettings) {
		if (!_.isString(strStoreID) || _.isEmpty(strStoreID)) throw 'Store id is illegal';
		if (!_.isString(strID) || _.isEmpty(strID)) throw 'Query id is illegal';
		if (objSettings === undefined) objSettings = {};
		if (!_.isPlainObject(objSettings)) throw 'Settings are illegal';

		// Validate settings:
		validateSettings(objSettings);
		// Get data store object:
		var store = storage.getItem('id', strStoreID);
		if (store === undefined) throw 'Store id could not be found';
		// Create a new query object & inherit parent endpoint if needed:
		if (objSettings.endpoint.indexOf('{{inherit}}') >= 0) {
			objSettings.endpoint = objSettings.endpoint.replace('{{inherit}}', store.settings.endpoint);
		}
		var query = new Query(strID, _.defaults(objSettings, store.settings));
		// Add the new query object to the store:
		store.addItem(query);
	}

	/**
	 * Removes a query from a store
	 * @param {String} strStoreID Store id from which to remove the query
	 * @param {String} strID Query id to remove
	 */
	function unregisterQuery (strStoreID, strID) {
		if (!_.isString(strStoreID) || _.isEmpty(strStoreID)) throw 'Store id is illegal';
		if (!_.isString(strID) || _.isEmpty(strID)) throw 'Query id is illegal';

		// Get data store object:
		var store = storage.getItem('id', strStoreID);
		if (store === undefined) throw 'Store id could not be found';
		// Remove a query from the store:
		store.removeItem(strID);
	}

	/**
	 * Removes all queries from a store
	 * @param strStoreID Store id from which to remove all queries
	 */
	function unregisterAll(strStoreID) {
		if (!_.isString(strStoreID) || _.isEmpty(strStoreID)) throw 'Store id is illegal';

		// Get data store object:
		var store = storage.getItem('id', strStoreID);
		if (store === undefined) throw 'Store id could not be found';
		// Remove all query objects from the store:
		store.removeAllItems();
	}

	/**
	 * Executes a query from a specific data store and stores the output in a Record object
	 * @param {String} strStoreID
	 * @param {String} strID
	 * @param {Object} objSettings Temporary query settings for current execution only. If set, it will override the default query settings
	 * @param objParams
	 */
	function executeQuery (strStoreID, strID, objSettings, objParams) {
		if (!_.isString(strStoreID) || _.isEmpty(strStoreID)) throw 'Store id is illegal';
		if (!_.isString(strID) || _.isEmpty(strID)) throw 'Query id is illegal';
		if (objSettings === undefined) objSettings = {};
		if (!_.isPlainObject(objSettings)) throw 'Settings are illegal';
		if (objParams === undefined) objParams = {};
		if (!_.isPlainObject(objParams)) throw 'Parameters are illegal';

		// Validate settings:
		validateSettings(objSettings);

		// Get data store and query objects:
		var store = storage.getItem('id', strStoreID);
		if (store === undefined) throw 'Store id could not be found';
		var query = store.getItem('id', strID);
		if (query === undefined) throw 'Query id could not be found';

		if (objSettings.endpoint)
			objSettings.endpoint = objSettings.endpoint.replace('{{inherit}}', store.settings.endpoint);

		// Create a new record object and execute query:
		var record = new Record(objParams, null);
		query.executeQuery(record, objSettings);
	}

	/**
	 * Counts all queries in a store
	 * @param strStoreID {String} Store id of which to count all queries
	 * @returns {Number} Number of queries
	 */
	function countQueries (strStoreID) {
		if (!_.isString(strStoreID) || _.isEmpty(strStoreID)) throw 'Store id is illegal';

		// Get data store object:
		var store = storage.getItem('id', strStoreID);
		if (store === undefined) throw 'Store id could not be found';

		return(store.countItems());
	}

	/**
	 * Counts all records in a query
	 * @param strStoreID {String} Store id to which the query belongs
	 * @param strQueryID {String} Query id of which to count all records
	 * @returns {Number} Number of queries
	 */
	function countRecords (strStoreID, strQueryID) {
		if (!_.isString(strStoreID) || _.isEmpty(strStoreID)) throw 'Store id is illegal';
		if (!_.isString(strQueryID) || _.isEmpty(strQueryID)) throw 'Query id is illegal';

		// Get data store and query objects:
		var store = storage.getItem('id', strStoreID);
		if (store === undefined) throw 'Store id could not be found';
		var query = store.getItem('id', strQueryID);
		if (query === undefined) throw 'Query id could not be found';

		return(query.countItems());
	}
	// </editor-fold>

	/**
	 * Library bootstrap
	 */
	(function () {
		// Check if lodash loaded:
		if (typeof(_) !== 'function') throw 'lodash library is required';

		// Create a new stores storage:
		storage = new Storage();

		_.templateSettings = {
			'interpolate': /{{([\s\S]+?)}}/g
		};

		console.log('ElephantJS is ready');
	})();

	return {
		create: createStore,
		destroy: destroyStore,
		destroyAll: destroyAll,
		countStores: countStores,

		register: registerQuery,
		unregister: unregisterQuery,
		unregisterAll: unregisterAll,
		countQueries: countQueries,
		execute: executeQuery,

		countRecords: countRecords,

		print: function () { console.log( storage ); }
	};
})(undefined);
