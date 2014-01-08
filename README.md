elephant.js
===========

Smart client side data objects manager

Introduction
------------
elephant.js is a javascript library that can help you manage your web application data by providing built-in AJAX mechanism and another one for storing and managing the incoming data.
It consists of stores, queries and records objects:
Each store contains one or more related queries that share the same settings.
Every time you execute a query, the returned data is stored in a new record object which then can be accessed whenever needed.

Settings
--------
JavaScript object:
* `format` {enum} - The type of the expected output. Can be either , xml or json
 Default: text
* `async` {boolean} - If you need synchronous requests, set this option to false
 Default: true
* `timeout` {number} - Set a timeout (in milliseconds) for the request
 Default: 30000
* `endpoint` {string} - Set an entry endpoint for a store / query
* `cacheable` {boolean} - If set to false, it will force queries to get data from server on every execution
 Default: true
* `method` {enum} - HTTP request method. Can be GET or POST
 Default: GET
* `expires` {number} - Set an expiration date (in milliseconds) for a query results in case it is cacheable
 Default: 300000 (5 mins)
* `success` {function array} - One or more functions to be called if the request succeeds
 Default: none
* `error` {function array} - One or more functions to be called if the request failed
 Default: none
* `complete` {function array} - One or more functions to be called after either success or error callbacks
 Default: none
* `process` {function} - A function to be called if the request succeeds in order to manipulate output
 Default: none

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
1. Create one or more stores objects by providing a name & settings to each store
2. Register one or more queries by providing the store name it is registered in, a query name & settings to each query.
 If you don't provide settings to a query, it inherits the settings of the store it is registered in
3. Execute a query
