import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Enum } from '../src';
import { Loader, Transformer } from '@ossph/idea';
//resusable variables
const cwd = __dirname;
const idea = Loader.absolute('./schema.idea', cwd);

describe('Enum Tests', () => {
  it('Should parse Enums', () => {
    const transformer = new Transformer(idea);
    const schema = transformer.schema;
    //populate enum
    for (const name in schema.enum) {
      Enum.add(name, schema.enum[name]);
    }

    const actual = Enum.get('Roles');

    expect(Enum.has('Roles')).to.be.true;
    expect(actual).to.be.an('object');
    expect(actual.OWNER).to.equal('owner');
    expect(actual.MODERATOR).to.equal('moderator');
    expect(actual.MEMBER).to.equal('member');
  }).timeout(20000);
});
