﻿var MongoClient = require('mongodb').MongoClient,
    util = require('util'),
    _ = require("underscore");

var connection = null;

function noop() { }

exports.connect = function (connectionString, callback) {
    MongoClient.connect(connectionString, function (err, db) {
        if (err) {
            console.log('Error connecting to mongodb: ' + err);
            callback(err);
            return;
        }

        connection = db;
        callback();
    });
};

function combinedJSON(producer_id, device_id, timestamp, data) {
    return _.extend(data, { 'producer': producer_id, 'timestamp': timestamp, 'device': device_id });
}

exports.writeSample = function (source_name, producer_id, device_id, timestamp, data, callback) {
    callback = callback || noop;

    if (!connection) {
        callback(new Error("Storage not connected"));
        return;
    }

    var collection = connection.collection(source_name);
    var sampleObj = combinedJSON(producer_id, device_id, timestamp, data);
    console.log(sampleObj);
    collection.insert(sampleObj, function (err, result) {
        if (err) {
            callback(err);
            return;
        }

        callback(result.ops[0]);
    });
};

exports.writeSamples = function (source_name, producer_id, device_id, timestamps, data_array, callback) {
    callback = callback || noop;

    if (!connection) {
        callback(new Error("Storage not connected"));
        return;
    }
    
    var collection = connection.collection(source_name);
    var data = new Array(data_array.length);
    for (var i = 0; i < data_array.length; i++) {
        data[i] = combinedJSON(producer_id, device_id, timestamps[i], data_array[i]);
    }

    collection.insert(data, function (err, result) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        callback(null, result.ops);
    })
};

exports.initializeCollection = function (collection_name, has_producer) {
    var collection = connection.collection(collection_name);
    collection.createIndex({ 'timestamp': 1 });
    if (has_producer) {
        collection.createIndex({ 'producer': 1 });
        collection.createIndex({ 'device': 1 });
    }
}

exports.query = function (source_name, q, callback) {
    callback = callback || noop;
    if (!connection) {
        callback(new Error("Storage not connected"));
        return;
    }

    var collection = connection.collection(source_name);
    collection.aggregate(q, function (err, result) {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }

        console.log(result);
        callback(null, result);
        return;
    });
};