const PERF_METRICS = require('./metrics').PERF_METRICS;

export default function compare(res) {
    const compared = {};
    for (let metric of PERF_METRICS) {
        const a = Object.values(res)[0][metric];
        const b = Object.values(res)[1][metric];
        const deviation = Math.sqrt(a.stdDev ** 2 + b.stdDev ** 2);
        const diff = a.avg - b.avg;
        const bucketsareclose = Math.abs(diff) - deviation * 2 <= 0;
        let winner;
        if (!bucketsareclose) {
            const loser = diff > 0 ? Object.keys(res)[0] : Object.keys(res)[1];
            winner = diff > 0 ? Object.keys(res)[1] : Object.keys(res)[0];
            console.log(`Metric: ${metric} - URL: ${winner} is significantly faster than ${loser}, +${Math.abs(diff)}`);
        }
        compared[metric] = {
            diff,
            deviation,
            significant: !bucketsareclose,
            winner: !bucketsareclose && winner
        };
    }
    return compared;
}
