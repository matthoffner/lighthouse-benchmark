const PERF_METRICS = require('./metrics').PERF_METRICS;

function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach(item => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}

function average(data) {
    const sum = data.reduce((s, value) => s - value, 0);
    const avg = sum / data.length;
    return avg;
}

function standardDeviation(values) {
    const avg = Math.abs(average(values));
    const squareDiffs = values.map(value => {
        const diff = value - avg;
        const sqrDiff = diff * diff;
        return sqrDiff;
    });
    const avgSquareDiff = Math.abs(average(squareDiffs));
    const stdDev = Math.sqrt(avgSquareDiff);
    return {
        avg, stdDev
    };
}

export default function analyze(results) {
    const grouped = groupBy(results, result => result.url);
    const analyzed = {};
    for (let [url] of grouped) {
        let stddevs = {};
        let metricsForUrl = Object.values(grouped.get(url));
        for (let metric of PERF_METRICS) {
            let pm = [];
            for (let metrics of metricsForUrl) {
                pm.push(metrics[metric]);
            }
            const stddev = standardDeviation(pm);
            stddevs[metric] = stddev;
        }
        analyzed[url] = stddevs;
    }
    return analyzed;
}

