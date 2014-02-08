/**
 * Elephant - Smart client side data objects manager
 * @version 0.2.0
 * @author Nir Elbaz
 * @requires $ http://jquery.com
 */

/**
 * @namespace
 */
(function (window, $, undefined) {
	'use strict';

	/**
	 *
	 * @type {{expires: number, process: null}}
	 * @private
	 */
	var _defaults = {
			'expires': 300000,	// Set an expiration date (in milliseconds) for a query results in case it is cacheable
			'process': null	// A function to be called if the request succeeds in order to manipulate output data
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
	 * @property {Object} objSettings Object settings
	 * @returns {Core}
	 * @constructor
	 */
	function Core (strID, objSettings) {
		if (!$.isString(strID) || $.isEmpty(strID)) throw 'Object id is illegal';
		if (objSettings === undefined) objSettings = {};
		if (!$.isPlainObject(objSettings)) throw 'Settings are illegal';

		this.id = strID.toString();
		this.settings = $.extend({}, _defaults, objSettings);
		this.items = [];

		return this;
	}
	Core.prototype = {
		/**
		 * Adds a new object to items collection
		 * @param {Object} objItem Object to add
		 */
		addItem: function (objItem) {
			if (!$.isObject(objItem)) throw 'Object is illegal';

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
		 * @returns {Number} Number of items in collection
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
			if (!$.isString(strID) || $.isEmpty(strID)) throw 'Object id is illegal';

			var intIndex = this.getIndex(strID);

			if (intIndex >= 0) {
				this.items.splice(intIndex, 1);
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
			var objItem = null,
				self = this;

			if (!$.isString(strProperty) || $.isEmpty(strProperty)) throw 'Property is illegal';

			$.each(self.items, function(index, item) {
				if (JSON.stringify(item[strProperty]) === JSON.stringify(objValue)) {
					objItem = item;
					return false;
				}
			});

			return objItem || undefined;
		},

		/**
		 * Returns an item index from a collection if it exists or -1 if it doesn't
		 * @param {String} objID The item's id
		 * @returns {number}
		 */
		getIndex: function (objID) {
			var self = this,
				intIndex = -1;

			$.each(self.items, function(index, item) {
				if (item.id === objID) {
					intIndex = index;
					return false;
				}
			});

			return intIndex;
		},

		/**
		 * Checks if an item exists in a collection
		 * @param {Object} objItem Object to check
		 * @returns {Boolean|boolean} True if exists, false otherwise
		 */
		itemExists: function (objItem) {
			var blnExists = false,
				blnAllPropsExist,
				self = this;

			if (!$.isObject(objItem)) throw 'Object is illegal';

			$.each(self.items, function(index, item) {
				blnAllPropsExist = true;
				for (var prop in objItem) {
					if (!item.hasOwnProperty(prop) || (item[prop] !== objItem[prop])) {
						blnAllPropsExist = false;
						break;
					}
				}
				if (blnAllPropsExist === true) {
					blnExists = true;
					return false;
				}
			});

			return blnExists;
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
		Core.call(this, 'Elephant', {});
	}
	Storage.prototype = Object.create(Core.prototype);
	Storage.prototype.constructor = Storage;

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
	Store.prototype = Object.create(Core.prototype);
	Store.prototype.constructor = Store;

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
	Query.prototype = Object.create(Core.prototype);
	Query.prototype.constructor = Query;
	Query.prototype.executeQuery = function (objRecord, objSettings) {
		// Settings given to execution are temporary and serve only the current execution:
		$.extend(objSettings, this.settings, objSettings);

		// Check if there is already record with the same parameters:
		if (this.settings.cache === true) {
			var objExistingRecord = this.getItem('params', objRecord.params);
			if ($.isEmpty(objExistingRecord) === false) {
				// Check if cached item is still valid:
				if ($.now() - objExistingRecord.timestamps.received < this.settings.expires) {
					var callbacks = objSettings.success;

					console.log('Serving item from cache...');

					// Add success function callback to array if there is only one function
					if (callbacks !== undefined) {
						if (typeof(callbacks) === 'function') {
							callbacks = [callbacks];
						}

						// Execute all success callbacks:
						for (var i = 0, length = callbacks.length; i < length; i++) {
							if (typeof(callbacks[i]) === 'function') {
								callbacks[i](objExistingRecord.data);
							}
						}
					}

					return objExistingRecord.data;
				}
				else {
					// Remove deprecated item and get an up-to-date record:
					this.removeItem(objExistingRecord.id);
				}
			}
		}

		var self = this;

		objRecord.timestamps.sent = $.now();
		return $.ajax(objSettings)
			.done(function (data) {
				// Manipulate output data if process callback is defined
				if (typeof(objSettings.process) === 'function') {
					data = objSettings.process(data);
				}
				// Add record object to the query object:
				objRecord.data = data;
				self.addItem(objRecord);
			})
			.fail(function () {
				// Remove record:
				objRecord = null;
			})
			.always(function () {
				if (objRecord !== null) {
					objRecord.timestamps.received = $.now();
				}
			});
	};

	/**
	 * An object in which single data object is stored
	 * @class Record
	 * @param {Object} objParams Collection of parameters which for current record
	 * @param {Object} objData Data object returned after execution
	 * @extends Core
	 * @constructor
	 */
	function Record (objParams, objData) {
		this.id = $.uniqueId();
		this.timestamps = {
			created: $.now(),
			sent: null,
			received: null
		};
		this.params = objParams;
		this.data = objData;
	}
	// </editor-fold>

	// <editor-fold desc="Methods">
	/**
	 * Validate object settings
	 * @param settings
	 */
	function validateSettings(settings) {
		if (typeof(settings) !== 'object') throw 'Settings are invalid';

		for(var item in settings) {
			if (settings.hasOwnProperty(item)) {
				switch (item) {
					case 'async':
						if($.isBoolean(settings[item]) === false)
							throw 'Settings are illegal: "async" must be a boolean';
						break;
					case 'dataType':
						if(/xml|script|json|html/.test(settings[item]) === false)
							throw 'Settings are illegal: "dataType" must be a either xml, json, html or script';
						break;
					case 'timeout':
						if($.isNumeric(settings[item]) === false)
							throw 'Settings are illegal: "timeout" must be a positive integer';
						break;
					case 'url':
						if($.isString(settings[item]) === false)
							throw 'Settings are illegal: "url" must be a string';
						break;
					case 'cache':
						if($.isBoolean(settings[item]) === false)
							throw 'Settings are illegal: "cache" must be a boolean';
						break;
					case 'expires':
						if($.isNumeric(settings[item]) === false)
							throw 'Settings are illegal: "expires" must be a positive integer';
						break;
					case 'type':
						if(/GET|POST|PUT|DELETE/.test(settings[item]) === false)
							throw 'Settings are illegal: "type" must be a either GET, POST, PUT or DELETE';
						break;
					case 'process':
						if($.isFunction(settings[item]) === false)
							throw 'Settings are illegal: "process" callback must be a function';
						break;
				}
			}

		}
	}

	/**
	 * Creates a new store in which data objects and queries are stored and share the same settings.
	 * @param strID {String} id New store id
	 * @param objSettings {Object} settings New store settings. Will be used as default settings for all of its items
	 */
	function createStore (strID, objSettings) {
		if (!$.isString(strID) || $.isEmpty(strID)) throw 'Store id is illegal';
		if (objSettings === undefined) objSettings = {};
		if (!$.isPlainObject(objSettings)) throw 'Settings are illegal';

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
	 * @param {Object} [objSettings] New query settings. Will be used as default settings for all of its items
	 */
	function registerQuery (strStoreID, strID, objSettings) {
		if (!$.isString(strStoreID) || $.isEmpty(strStoreID)) throw 'Store id is illegal';
		if (!$.isString(strID) || $.isEmpty(strID)) throw 'Query id is illegal';
		if (objSettings === undefined) objSettings = {};
		if (!$.isPlainObject(objSettings)) throw 'Settings are illegal';

		// Validate settings:
		validateSettings(objSettings);
		// Get data store object:
		var store = storage.getItem('id', strStoreID);
		if (store === undefined) throw 'Store id could not be found';
		// Create a new query object & inherit parent's url if needed:
		for (var prop in objSettings) {
			if (objSettings.hasOwnProperty(prop)) {
				switch (prop) {
					case 'success':
						// append, prepend, replace
						break;
				}
			}
		}
		var query = new Query(strID, $.extend(objSettings, store.settings, objSettings));
		if (objSettings.url.indexOf('{{inherit}}') >= 0) {
			objSettings.url = objSettings.url.replace('{{inherit}}', store.settings.url);
		}
		// Add the new query object to the store:
		store.addItem(query);
	}

	/**
	 * Removes a query from a store
	 * @param {String} strStoreID Store id from which to remove the query
	 * @param {String} strID Query id to remove
	 */
	function unregisterQuery (strStoreID, strID) {
		if (!$.isString(strStoreID) || $.isEmpty(strStoreID)) throw 'Store id is illegal';
		if (!$.isString(strID) || $.isEmpty(strID)) throw 'Query id is illegal';

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
		if (!$.isString(strStoreID) || $.isEmpty(strStoreID)) throw 'Store id is illegal';

		// Get data store object:
		var store = storage.getItem('id', strStoreID);
		if (store === undefined) throw 'Store id could not be found';
		// Remove all query objects from the store:
		store.removeAllItems();
	}

	/**
	 * Executes a query from a specific data store and stores the output data in a Record object
	 * @param {String} strStoreID Store id which the query belongs to
	 * @param {String} strQueryID Query id to execute
	 * @param {Object} [objSettings] Temporary query settings for current execution only. If set, it will override the default query settings
	 */
	function executeQuery (strStoreID, strQueryID, objSettings) {
		if (!$.isString(strStoreID) || $.isEmpty(strStoreID)) throw 'Store id is illegal';
		if (!$.isString(strQueryID) || $.isEmpty(strQueryID)) throw 'Query id is illegal';
		if (objSettings === undefined) objSettings = {};
		if (!$.isPlainObject(objSettings)) throw 'Settings are illegal';

		// Validate settings:
		validateSettings(objSettings);

		// Get data store and query objects:
		var store = storage.getItem('id', strStoreID);
		if (store === undefined) throw 'Store id could not be found';
		var query = store.getItem('id', strQueryID);
		if (query === undefined) throw 'Query id could not be found';

		if (objSettings.url)
			objSettings.url = objSettings.url.replace('{{inherit}}', store.settings.url);

		// Create a new record object and execute query:
		var record = new Record(objSettings.data || {}, null);
		return query.executeQuery(record, objSettings);
	}

	/**
	 * Counts all stores, queries or records
	 * @param {String} [strStoreID] Store id
	 * @param {String} [strQueryID] Query id. If specified then previous param is required
	 * @returns {Number} Number of stores if no parameter was specified or number of queries if storeId was specified, otherwise - number of records
	 */
	function count (strStoreID, strQueryID) {
		var intCount = 0,
			store,
			query;

		switch (arguments.length) {
			case 0:	// Count stores
				intCount = storage.countItems();
				break;
			case 1:	// Count queries
				// Validate input:
				if (!$.isString(strStoreID)) throw 'Store id is illegal';
				// Get store:
				store = storage.getItem('id', strStoreID);
				if (store === undefined) throw 'Store id could not be found';
				intCount = store.countItems();
				break;
			case 2:	// Count records
				// Validate input:
				if (!$.isString(strStoreID) || $.isEmpty(strStoreID)) throw 'Store id is illegal';
				if (!$.isString(strQueryID) || $.isEmpty(strQueryID)) throw 'Query id is illegal';
				// Get store:
				store = storage.getItem('id', strStoreID);
				if (store === undefined) throw 'Store id could not be found';
				// Get query of store:
				query = store.getItem('id', strQueryID);
				if (query === undefined) throw 'Query id could not be found';
				intCount = query.countItems();
				break;
		}
		// Return number of items:
		return(intCount);
	}
	// </editor-fold>

	/**
	 * Library bootstrap
	 */
	(function () {
		// Check if lodash loaded:
		if (typeof($) !== 'function') throw 'jQuery library is required';

		var objectTypes = {
				'boolean': false,
				'function': true,
				'object': true,
				'number': false,
				'string': false,
				'undefined': false
			},
			idCounter = 0;

		// Extends jQuery functions list:
		$.extend({
			isBoolean: function(objValue) {
				return objValue === true || objValue === false ||
					objValue && typeof objValue === 'object' && Object.prototype.toString.call(objValue) === '[object Boolean]' || false;
			},
			isEmpty: function(objValue) {
				var result = true;

				if (!objValue) {
					return result;
				}
				var className = Object.prototype.toString.call(objValue),
					length = objValue.length;

				if ((className === '[object Array]' || className === '[object String]' || className === '[object Arguments]' ) ||
					(className === '[object Object]' && typeof length === 'number' && $.isFunction(objValue.splice))) {
					return !length;
				}
				if ($.isObject(objValue)) {
					return JSON.stringify(objValue) === '{}';
				}
				return result;
			},
			isObject: function (objValue) {
				return !!(objValue && objectTypes[typeof objValue]);
			},
			isString: function (objValue) {
				return typeof objValue === 'string' ||
					objValue && typeof objValue === 'object' && Object.prototype.toString.call(objValue) === '[object String]' || false;
			},
			uniqueId: function (strPrefix) {
				var id = ++idCounter;
				return String(strPrefix === undefined ? '' : strPrefix) + id;
			},
			pluck: function (items, prop) {
				var output = [];

				$.each(items, function(index, item) {
					if(item.hasOwnProperty(prop)) {
						output.push(item[prop]);
					}
				});

				return output;
			}
		});

		// Add Object.create support for IE8:
		if (!Object.create) {
			Object.create = (function(){
				function F(){}

				return function(o){
					if (arguments.length !== 1) {
						throw new Error('Object.create implementation only accepts one parameter.');
					}
					F.prototype = o;
					return new F();
				};
			})();
		}

		window.Elephant = window.Elephant || {
			create: createStore,
			destroy: destroyStore,
			destroyAll: destroyAll,

			register: registerQuery,
			unregister: unregisterQuery,
			unregisterAll: unregisterAll,
			fetch: executeQuery,

			count: count
		};

		// Create a new stores storage:
		storage = new Storage();

		console.log('Elephant is ready');

		return window.Elephant;
	})();
})(window, jQuery);
