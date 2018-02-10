# zkp-json - ZooKeeper JSON Converter

[![Build Status](https://travis-ci.org/amitshlo/zkp-json.svg?branch=master)](https://travis-ci.org/amitshlo/zkp-json)
[![](https://images.microbadger.com/badges/image/amitshlo/zkp-json.svg)](https://microbadger.com/images/amitshlo/zkp-json "Get your own image badge on microbadger.com")
[![](https://images.microbadger.com/badges/version/amitshlo/zkp-json.svg)](https://microbadger.com/images/amitshlo/zkp-json "Get your own version badge on microbadger.com")

A simple REST service to convert Zookepeer trees to JSON and create them from JSON.

### Features

* Convert ZooKeeper trees to JSON.
* Create ZooKeeper trees from JSON.
* Support JSONs as node data.


## How to Install

### Using Docker

TODO

### From scratch

TODO

## How to use

### Convert to JSON

There's two options for how to retrieve zookeeper as JSON:
1. Get the ENTIRE tree: 
```
GET http://server-address:port/toJSON
```

2. Get the tree from the given node:
```
POST http://server-address:port/toJSON
PARAMS {"path: "/somepath"}
```

Note: If a node has data and children than the data will be saved in '_data' property, if there's only data than it will be saved directly under the node. 

### Create from JSON

Create the tree from the given path and JSON: 
```
POST http://server-address:port/fromJSON
PARAMS {"path: "/somepath", "data": {"node_name": {"child":"child_data", "_data":"node_data", "complex_child": {"child":"child_data", "_data":"node_data"}...}}}
```

### Delete tree from path

TODO

### Duplicate tree

TODO
