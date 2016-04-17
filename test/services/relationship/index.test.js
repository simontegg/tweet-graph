'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('relationship service', () => {
  it('registered the relationships service', () => {
    assert.ok(app.service('relationships'));
  });
});
