import type { Column } from '../src';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Model } from '../src';
import { Loader, Transformer } from '@ossph/idea';
//resusable variables
const cwd = __dirname;
const idea = Loader.absolute('./schema.idea', cwd);

describe('Model Tests', () => {
  it('Should parse Models', () => {
    const transformer = new Transformer(idea);
    const schema = transformer.schema;
    //populate enum
    for (const name in schema.model) {
      Model.add(schema.model[name]);
    }

    expect(Model.has('Profile')).to.be.true;

    const model = new Model('Profile');

    expect(model.camel).to.equal('profile');
    expect(model.columns[0].name).to.equal('id');
    expect(model.columns[0].type).to.equal('String');
    expect(model.fields[0].name).to.equal('name');
    expect(model.fields[0].type).to.equal('String');
    expect(model.fieldsets[0].name).to.equal('addresses');
    expect(model.fieldsets[0].type).to.equal('Address');
    expect(model.icon).to.equal('user');
    expect(model.label[0]).to.equal('Profile');
    expect(model.label[1]).to.equal('Profiles');
    expect(model.lists[0].name).to.equal('id');
    expect(model.lists[0].type).to.equal('String');
    expect(model.lower).to.equal('profile');
    expect(model.name).to.equal('Profile');
    expect(model.plural).to.equal('Profiles');
    expect(model.singular).to.equal('Profile');
    expect(model.title).to.equal('Profile');
    expect(model.views[0].name).to.equal('id');
    expect(model.views[0].type).to.equal('String');
    expect(model.column('name')?.name).to.equal('name');
    expect(model.column('foo')).to.be.null;
    expect(model.destination('/some/[name]/path')).to.equal('/some/profile/path');

    expect(model.created?.name).to.equal('created');
    expect(model.filterables[0].name).to.equal('type');
    expect(model.ids[0].name).to.equal('id');
    expect(model.indexables[0].name).to.equal('name');
    expect(model.paths.entity).to.equal('profile');
    expect(model.paths.object[0]).to.equal('[id]');
    expect(model.related[0].name).to.equal('auth');
    expect(model.relations.length).to.equal(0);
    expect(model.restorable).to.be.true;
    expect(model.searchables[0].name).to.equal('name');
    expect(model.sortables[0].name).to.equal('created');
    expect(model.spanables[0].name).to.equal('created');
    expect(model.relations.length).to.equal(0);
    expect(model.updated?.name).to.equal('updated');
    expect(model.suggested('results.%s')).to.equal('results.name');

    const id = model.column('id') as Column;
    expect(id.generated).to.be.true;
    expect(id.id).to.be.true;
    expect(id.list.method).to.equal('char');
    expect(id.view.method).to.equal('none');
    expect(id.type).to.equal('String');

    const name = model.column('name') as Column;
    expect(name.name).to.equal('name');
    expect(name.required).to.be.true;
    expect(name.searchable).to.be.true;

    const active = model.column('active') as Column;
    expect(active.active).to.be.true;
    expect(active.label).to.equal('Active');

    const type = model.column('type') as Column;
    expect(type.default).to.equal('person');
    expect(type.field.method).to.equal('text');
    expect(type.filterable).to.be.true;
    expect(type.indexable).to.be.true;

    const roles = model.column('roles') as Column;
    expect(roles.multiple).to.be.true;

    const created = model.column('created') as Column;
    expect(created.sortable).to.be.true;
    expect(created.spanable).to.be.true;

    const auth = model.column('auth') as Column;
    expect(auth.model?.name).to.equal('Auth');
    expect(auth.related?.parent.model.name).to.equal('Profile');

    const address = model.column('addresses') as Column;
    expect(address.fieldset?.name).to.equal('Address');
  }).timeout(20000);
});
