import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Fieldset } from '../src';
import { Loader, Transformer } from '@ossph/idea';
//resusable variables
const cwd = __dirname;
const idea = Loader.absolute('./schema.idea', cwd);

describe('Fieldset Tests', () => {
  it('Should parse Fieldsets', () => {
    const transformer = new Transformer(idea);
    const schema = transformer.schema;
    //populate enum
    for (const name in schema.type) {
      Fieldset.add(schema.type[name]);
    }

    expect(Fieldset.has('Address')).to.be.true;
    
    const fieldset = new Fieldset('Address');

    expect(fieldset.camel).to.equal('address');
    expect(fieldset.columns[0].name).to.equal('name');
    expect(fieldset.columns[0].type).to.equal('String');
    expect(fieldset.fields[0].name).to.equal('name');
    expect(fieldset.fields[0].type).to.equal('String');
    expect(fieldset.fieldsets[0].name).to.equal('contact');
    expect(fieldset.fieldsets[0].type).to.equal('Contact');
    expect(fieldset.icon).to.equal('map-marker');
    expect(fieldset.label[0]).to.equal('Address');
    expect(fieldset.label[1]).to.equal('Addresses');
    expect(fieldset.lists[0].name).to.equal('name');
    expect(fieldset.lists[0].type).to.equal('String');
    expect(fieldset.lower).to.equal('address');
    expect(fieldset.name).to.equal('Address');
    expect(fieldset.plural).to.equal('Addresses');
    expect(fieldset.singular).to.equal('Address');
    expect(fieldset.title).to.equal('Address');
    expect(fieldset.views[0].name).to.equal('name');
    expect(fieldset.views[0].type).to.equal('String');
    expect(fieldset.column('name')?.name).to.equal('name');
    expect(fieldset.column('foo')).to.be.null;
    expect(fieldset.destination('/some/[name]/path')).to.equal('/some/address/path');
  }).timeout(20000);
});
