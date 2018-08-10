const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const analyze = require('./analyze').default;
const compare = require('./compare').default;
const PERF_METRICS = require('./metrics').PERF_METRICS;

function getConfig(arg) {
    return require(`../config/${arg[2]}`);
}

async function startLighthouse(url, flags) {
    return chromeLauncher.launch(flags).then(chrome => {
        flags.port = chrome.port;
        flags.perfConfig = { onlyCategories: ['performance'] };
        return lighthouse(url, flags).then(results =>
            chrome.kill().then(() => results)
        );
    });
}

const flags = {
    chromeFlags: ['--disable-gpu', '--headless', '--enable-logging', '--no-sandbox']
};

async function lighthouseRunner(urls, label, abtest) {
    const totals = [];
    for (let url of urls) {
        await startLighthouse(url, flags)
            .then(res => {
                let metrics = {};
                const lhr = res.lhr;
                PERF_METRICS.forEach(metric => {
                    metrics[metric] = lhr.audits[metric].rawValue;
                });
                metrics = {
                    ...metrics,
                    timestamp: lhr.fetchTime,
                    score: lhr.categories.performance.score,
                    url: lhr.requestedUrl,
                    label
                };
                console.log(metrics);
                totals.push(metrics);
            });
    }
    const analyzed = analyze(totals);
    console.log(analyzed);
    if (abtest) {
        const compared = compare(analyzed);
        console.log(compared);
    }
    return totals;
}

async function runAll(suites) {
    for (let suite of suites) {
        await lighthouseRunner(suite.urls, suite.label);
    }
}

async function run(suite, abtest) {
    await lighthouseRunner(suite.urls, suite.label, abtest);
}

function runLighthouse(argv) {
    const args = argv || process.argv;
    let benchmark;
    let url;
    if (args.length >= 3 && args.length !== 4) {
        if (args[2].includes('http')) {
            url = args[2];
            let suite = {};
            let abtest;
            if (args[4]) { // a/b test mode
                abtest = true;
                benchmark = parseInt(args[4], 10);
                const aurls = new Array(benchmark).fill(args[2]);
                const burls = new Array(benchmark).fill(args[3]);
                suite = {
                    label: 'benchmark',
                    urls: aurls.concat(burls)
                };
            } else { // single url mode
                suite = {
                    label: url,
                    urls: [url]
                };
            }
            run(suite, abtest);
        } else {
            runAll(getConfig(args)); // complete list
        }
    } else if (args.length === 4) { // benchmark or subset
        benchmark = args[3] && parseInt(args[3], 10);
        if (benchmark && args[2] && args[2].includes('http')) { // benchmark
            url = args[2];
            let suite = {
                label: 'benchmark',
                urls: new Array(benchmark).fill(url)
            };
            run(suite);
        } else { // subset of urls
            run(getConfig(args).filter(p => p.label === args[3])[0], false);
        }
    }
}

runLighthouse();
