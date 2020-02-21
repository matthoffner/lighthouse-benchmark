# lighthouse-benchmark

A simple node.js cli for running multiple Lighthouse tests and analyzing the results.


## installation

Save as a dev dependency

```
npm install lighthouse-benchmark --save-dev
```

Or install as a global dependency if you wish

```
npm install lighthouse-benchmark --g
```

## usage

```
lb https://google.com
```

```
lb https://porch.com 5
```

```
lb https://microsoft.com https://apple.com 5
```

```
lb config.json
```
