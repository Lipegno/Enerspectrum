////////////////////////////////////////////////////////////////
// Query.js
//
//  Queries are specified in a JSON format which is extremely
//  similar to the native Mongodb aggregation pipeline format.
//  However, we proxy instead of directly querying because
//  we want to check to ensure that the user isn't inserting
//  parameters that will modify the database or reveal
//  information that they should not be able to access.
//  This is part of a defense-in-depth strategy--samples are
//  also stored in a separate database from user and admin
//  information, so even if something slips through, the worst
//  consequence should be accessing information from other
//  homes. Proxying also has the advantage that we can now
//  convert to say SQL or another query language if we want
//  to change backends.
////////////////////////////////////////////////////////////////

var _ = require('underscore'),
    storage = require('../storage'),
    expression = require('./expression.js'),
    async = require('async');

function makeSortPair(x) {
    if (x[0] == '-') {
        return [x.substr(1), -1];
    } else {
        return [x, 1];
    }
}

function convertSort(v) {
    return { '$sort': _.object(_.map(v, makeSortPair)) };
}

function convertMatch(v) {

}

function convertLimit(v) {
    var value = parseInt(v);
    if (value > 0) {
        return { '$limit': value };
    }
}

function parseExpression(exp) {

}

function convertProject(v) {
    var projection = {};
    for (var i = 0; i < v.length; i++) {
        var exp = expression(v[i]);
        if (!exp) {
            return;
        }

        projection = _.extend(projection, exp);
    }

    return { '$project': projection };
}

var typeCheckers = {
    '$sort': convertSort,
    '$match': convertMatch,
    '$limit': convertLimit,
    '$project': convertProject
};

function toStorageFormat(client, source, query) {
    var storagePipeline = [];

    for (var i = 0; i < query.length; i++) {
        if (_.keys(query[i]).length != 1) {
            console.log('query error: only one operation can be specified per pipeline stage');
            return;
        }
        
        var op = _.keys(query[i])[0];

        if (!(op in typeCheckers)) {
            console.log('unknown operation %s', op);
            return;
        }

        var convertedOp = typeCheckers[op](query[i][op]);
        if (!convertedOp) {
            console.log('Invalid parameters for op %s', op);
            return;
        }

        storagePipeline.push(convertedOp);
    }

    return storagePipeline;
};

function execute(client, source, query, callback) {
    var convertedQuery = toStorageFormat(client, source, query);
    if (!convertedQuery) {
        callback(new Error('Query not allowed'));
        return;
    }

    storage.query(source.name, convertedQuery, callback);
};

exports.execute = execute;

