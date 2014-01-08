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
* `format` - The type of the expected output. Can be text, xml or json
* `async` - If you need synchronous requests, set this option to false
* `timeout` - Set a timeout (in milliseconds) for the request
* `endpoint` - Set an entry endpoint for a store / query
* `cacheable` - If set to false, it will force queries to get data from server on every execution
* `method` - HTTP request method. Can be GET or POST
* `expires` - Set an expiration date (in milliseconds) for a query results in case it is cacheable
* `success` - One or more functions to be called if the request succeeds
* `error` - One or more functions to be called if the request failed
* `complete` - One or more functions to be called after either success or error callbacks
* `process` - A function to be called if the request succeeds in order to manipulate output

Methods
-------
* `ElephantJS.create({string} storeId, {object} settings)`
* `ElephantJS.destroy({string} storeId)`
* `ElephantJS.destroyAll()`
* `ElephantJS.countStores()`
* `ElephantJS.register({string} storeId, {string} queryId, {object} settings)`
* `ElephantJS.unregister({string} storeId, {string} queryId)`
* `ElephantJS.unregisterAll({string} storeId)`
* `ElephantJS.countQueries({string} storeId)`
* `ElephantJS.execute({string} storeId, {string} queryId, {object} settings, {object} params)`
* `ElephantJS.countRecords({string} storeId, {string} queryId)`

How To Use
----------
1. Create one or more stores objects by providing a name & settings to each store
2. Register one or more queries by providing the store name it is registered in, a query name & settings to each query.
 If you don't provide settings to a query, it inherits the settings of the store it is registered in
3. Execute a query
