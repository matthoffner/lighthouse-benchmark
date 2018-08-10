import analyze from '../src/analyze';
import compare from '../src/compare';
import { expect } from 'chai';

import { FIXTURE_RESULTS, FIXTURE_ANALYZED } from './fixture';


describe('suite', () => {
    it('analyzes e2e', () => {
        const results = analyze(FIXTURE_RESULTS);
        expect(results['https://porch.com/ab-test-1']['time-to-first-byte'].stdDev)
            .to.equal(89.93825042154691);
        expect(results['https://porch.com/ab-test-2'].interactive.avg)
            .to.equal(12070.15426666667);
    });

    it('compares for significance', () => {
        const results = compare(FIXTURE_ANALYZED);
        expect(results['time-to-first-byte'].significant)
            .to.be.true;
        expect(results['estimated-input-latency'].deviation)
            .to.equal(190.96247449870003);
    });
});
