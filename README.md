elephant.js
===========

Data store manager for web applications

Introduction
------------
elephant.js is a javascript library that can help you manage your web application data by providing built-in AJAX mechanism and another one for storing and managing the incoming data.
It consists of stores, queries and records objects:
Each store contains one or more related queries that share the same settings.
Every time you execute a query, the returned data is stored in a new record object which then can be accessed whenever needed.

Settings
--------
JavaScript object:
* `format` {enum} - The type of the expected output. Can be either , xml or json. Default: text
* `async` {boolean} - If you need synchronous requests, set this option to false. Default: true
* `timeout` {number} - Set a timeout (in milliseconds) for the request. Default: 30000
* `endpoint` {string} - Set an entry endpoint for a store / query
* `cacheable` {boolean} - If set to false, it will force queries to get data from server on every execution. Default: true
* `method` {enum} - HTTP request method. Can be GET or POST. Default: GET
* `expires` {number} - Set an expiration date (in milliseconds) for a query results in case it is cacheable. Default: 300000 (5 mins)
* `success` {function array} - One or more functions to be called if the request succeeds. Default: none
* `error` {function array} - One or more functions to be called if the request failed. Default: none
* `complete` {function array} - One or more functions to be called after either success or error callbacks. Default: none
* `process` {function} - A function to be called if the request succeeds in order to manipulate output. Default: none

Methods
-------
* `ElephantJS.create({string} storeId[, {object} settings])` - Creates a new store in which data objects and queries are stored and share the same settings
* `ElephantJS.destroy({string} storeId)` - Removes an existing store totally, including its settings, queries & data objects
* `ElephantJS.destroyAll()` - Removes all stores totally, including its settings, queries & data objects
* `ElephantJS.countStores()` - Counts all stores in storage
* `ElephantJS.register({string} storeId, {string} queryId[, {object} settings])` - Adds a new query to a store
* `ElephantJS.unregister({string} storeId, {string} queryId)` - Removes a query from a store
* `ElephantJS.unregisterAll({string} storeId)` - Removes all queries from a store
* `ElephantJS.countQueries({string} storeId)` - Counts all queries in a store
* `ElephantJS.execute({string} storeId, {string} queryId[, {object} settings, {object} params])` - Executes a query from a specific data store and stores the output in a Record object
* `ElephantJS.countRecords({string} storeId, {string} queryId)` - Counts all records in a query

How To Use
----------
1. Include a script reference to elephant.min.js and lodash.min.js files. For old browsers support, add a reference to lodash.compat.min.js instead of lodash.min.js.
2. Create one or more stores objects by providing a name & settings to each store
3. Register one or more queries by providing the store name it is registered in, a query name & settings to each query.
 If you don't provide settings to a query, it inherits the settings of the store it is registered in
4. Execute a query

Sample:
-------
* In your main HTML file, add a script reference to elephant.min.js and lodash.min.js
* Create a new store for queries related to weather:

```javascript
Elephant.create('Weather', {
	'endpoint': 'http://api.openweathermap.org/data/2.5/weather',
	'format': 'json',
	'success': [function (data) {
		console.log('%cThe weather in %s: %s', 'color: green', data.name, data.weather[0].description);
	}],
	'error': [function (xhr) {
		console.error('An error has occurred while trying to fetch');
	}]
});
```

* Register a query which fetches weather by city name:

```javascript
Elephant.register('Weather', 'getByCity');
```

* Register a query which fetches weather by coordinates:

```javascript
Elephant.register('Weather', 'getByCoords');
```

* Execute the first query for London as location:

```javascript
Elephant.execute('Weather', 'getByCity', {}, {
	'q': 'London, uk'
});
```
* Execute the first query for Tel Aviv as location:

```javascript
Elephant.execute('Weather', 'getByCity', {}, {
	'q': 'Tel Aviv, il'
});
```
* Execute the second query:

```javascript
Elephant.execute('Weather', 'getByCoords', {}, {
	'lat': 41.881944,
	'lon': -87.627778
});
```
* Execute AGAIN the first query for London as location, to check the caching:

```javascript
window.setTimeout(function () {
	Elephant.execute('Weather', 'getByCity', {}, {
		'q': 'London, uk'
	});
}, 5000);
```

Dependencies
------------
The fabulous [Lodash](http://lodash.com/) library
