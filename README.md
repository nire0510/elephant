elephant - v.0.2.3
==================

Data store manager for web applications

Introduction
------------
elephant is a javascript library that can help you manage your web application data by providing built-in AJAX mechanism and another one for storing and managing the incoming data.
It consists of data stores, queries and records objects:
Each data store contains one or more related queries that share the same settings.
Every time you execute a query, the returned data is stored in a new record object which then can be accessed whenever needed.

Settings
--------
JavaScript object:

* `process` {function} - A function to be called if the request succeeds in order to manipulate output. Default: none
* `expires` {number} - Set an expiration date (in milliseconds) for a query results in case it is cacheable. Default: 300000 (5 mins)

The rest of javascript object members are all based on [jQuery ajax](http://api.jquery.com/jQuery.ajax/) module. The following list shows some of them:

* `dataType` {enum} - The type of the expected output. Can be either , xml or json. Default: text
* `async` {boolean} - If you need synchronous requests, set this option to false. Default: true
* `timeout` {number} - Set a timeout (in milliseconds) for the request. Default: 30000
* `url` {string} - Set an entry endpoint for a store / query
* `cache` {boolean} - If set to false, it will force queries to get data from server on every execution. Default: true
* `type` {enum} - HTTP request method. Can be GET or POST. Default: GET
* `success` {function array} - One or more functions to be called if the request succeeds. Default: none
* `error` {function array} - One or more functions to be called if the request failed. Default: none
* `complete` {function array} - One or more functions to be called after either success or error callbacks. Default: none
* `data` {object} - HTTP request parameters

Methods
-------
* `Elephant.create({string} storeID[, {object} settings])` - Creates a new data store in which data objects and queries are stored and share the same settings
* `Elephant.destroy({string} storeID)` - Removes an existing data store totally, including its settings, queries & data objects
* `Elephant.destroyAll()` - Removes all data stores totally, including its settings, queries & data objects
* `Elephant.count()` - Counts all data stores in storage
* `Elephant.register({string} storeID, {string} queryID[, {object} settings])` - Adds a new query to a data store
* `Elephant.unregister({string} storeID, {string} queryID)` - Removes a query and its data objects from a data store
* `Elephant.unregisterAll({string} storeID)` - Removes all queries from a data store
* `Elephant.count({string} storeID)` - Counts all queries in a data store
* `Elephant.fetch({string} storeID, {string} queryID[, {object} settings])` - Executes a query from a specific data store asynchronously and stores the output in a Record object. If `cache` setting is set to `true` and query was already executed once, data is served from cache instead of XHR request execution
* `Elephant.count({string} storeID, {string} queryID)` - Counts all records in a query
* `Elephant.settings({string} storeID[, {string} queryID])` - Returns settings of a store or a query

How To Use
----------
1. Include a script reference to elephant.min.js and jquery.min.js (>= 1.5) files
2. Create one or more data stores objects by providing a name & settings to each data store
3. Register one or more queries by providing the data store name it is registered in, as well as a query name & settings to each query.
   If you don't provide settings to a query, it inherits the settings of the data store it is registered in;
   In addition, you can modify parent's settings by using `Elephant.settings(...)` method.
4. Execute a query. You can either provide callbacks or use jQuery deferred object to gain control the over the async behavior of the XHR

Sample (using callbacks):
-------------------
* In your main HTML file, add a script reference to elephant.min.js and jquery.min.js

```javascript
<script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>
<script src="src/elephant.jq.js"></script>
```

* Create a new store for queries related to weather:

```javascript
Elephant.create('Weather', {
	'url': 'http://api.openweathermap.org/data/2.5/weather',
	'dataType': 'json',
	'success': [function (data) {
		console.log('%cThe weather in %s: %s', 'color: green', data.name, data.weather[0].description);
	}],
	'error': [function (xhr, status, exception) {
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
Elephant.fetch('Weather', 'getByCity', {
	'data': {
		'q': 'London, uk'
  	}
});
```

* Execute the first query for Tel Aviv as location:

```javascript
Elephant.fetch('Weather', 'getByCity', {
	'data': {
		'q': 'Tel Aviv, il'
  	}
});
```

* Execute the second query:

```javascript
Elephant.fetch('Weather', 'getByCoords', {
	'data': {
		'lat': 41.881944,
        'lon': -87.627778
  	}
});
```

* Execute AGAIN the first query for London as location, to check the caching:

```javascript
window.setTimeout(function () {
	Elephant.fetch('Weather', 'getByCity', {
		'data': {
        	'q': 'London, uk'
    	}
	});
}, 5000);
```

Sample (using promises):
-------------------
* In your main HTML file, add a script reference to elephant.min.js and jquery.min.js

```javascript
<script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>
<script src="src/elephant.jq.js"></script>
```

* Create a new store for queries related to weather:

```javascript
Elephant.create('Weather', {
	'url': 'http://api.openweathermap.org/data/2.5/weather',
	'dataType': 'json'
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
$.wait(
	Elephant.fetch('Weather', 'getByCity', {
		'data': {
			'q': 'London, uk'
		}
	}),
	Elephant.fetch('Weather', 'getByCoords', {
    	'data': {
    		'lat': 41.881944,
            'lon': -87.627778
      	}
    })
).done(function (jqxhr1, jqxhr2) {
	// both requests completed successfully...
});
```

RequireJS Configuration
-----------------------
Elephant is AMD compliance. Follow the following configuration to use Elephant as AMD module:

```javascript
require.config({
	baseUrl: 'scripts',
	'paths': {
		'elephant': 'elephant',
		'jquery': 'http://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min'
	},

	'shim': {
		'elephant': {
			'deps': ['jquery']
		}
	}
});

require(['elephant'], function (elephant) {
	'use strict';

	console.log('Now you can use Elephant!');
});
```

Dependencies
------------
The fabulous [jQuery](http://jquery.com/) library
