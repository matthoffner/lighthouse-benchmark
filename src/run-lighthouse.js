require("@babel/register"); // eslint-disable-line
const lighthouse = require("lighthouse"); // eslint-disable-line
const analyze = require("./analyze").default; //eslint-disable-line
const compare = require("./compare").default; //eslint-disable-line
const PERF_METRICS = require("./metrics").PERF_METRICS; //eslint-disable-line
const { URL } = require("url"); //eslint-disable-line
const launchPuppeteer = require("./launch").default; //eslint-disable-line

function getConfig(arg) {
  return require(`../config/${arg[2]}`); //eslint-disable-line
}

async function startLighthouse(url, label) {
    const browser = await launchPuppeteer();
    const res = await lighthouse(url, {
        port: new URL(browser.wsEndpoint()).port,
        output: 'json'
    });
    let metrics = {};
    const lighthouseResponse = res;
    const lhr = lighthouseResponse.lhr;
    PERF_METRICS.forEach(metric => {
        metrics[metric] = lhr.audits[metric].numericValue;
    });
    metrics = {
        ...metrics,
        timestamp: lhr.fetchTime,
        score: lhr.categories.performance.score,
        url: lhr.requestedUrl,
        label
    };
    console.log(metrics);
    browser.close();
    return metrics;
}

async function lighthouseRunner(urls, label, abtest) {
    const totals = [];
    let metrics;
    for (const url of urls) {
        metrics = await startLighthouse(url, label);
        totals.push(metrics);
    }
    const analyzed = await analyze(totals);
    console.log(analyzed);
    if (abtest) {
        const compared = await compare(analyzed);
        console.log(compared);
    }

    return totals;
}

async function runAll(suites) {
    for (const suite of suites) {
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
            if (args[4]) {
                // a/b test mode
                abtest = true;
                benchmark = parseInt(args[4], 10);
                const aurls = new Array(benchmark).fill(args[2]);
                const burls = new Array(benchmark).fill(args[3]);
                suite = {
                    label: 'benchmark',
                    urls: aurls.concat(burls)
                };
            } else {
                // single url mode
                suite = {
                    label: url,
                    urls: [url]
                };
            }
            run(suite, abtest);
        } else {
            runAll(getConfig(args)); // complete list
        }
    } else if (args.length === 4) {
        // benchmark or subset
        benchmark = args[3] && parseInt(args[3], 10);
        if (benchmark && args[2] && args[2].includes('http')) {
            // benchmark
            url = args[2];
            const suite = {
                label: 'benchmark',
                urls: new Array(benchmark).fill(url)
            };
            run(suite);
        } else {
            // subset of urls
            run(getConfig(args).filter(p => p.label === args[3])[0], false);
        }
    }
}

runLighthouse();
