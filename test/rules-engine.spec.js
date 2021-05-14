const path = require('path');
const { expect } = require('chai');
const Harness = require('../src/harness');

const { availableCoreVersions } = require('../src/cht-core-libs');

for (const coreVersion of availableCoreVersions) {
  describe(`tests targeting rules engine v${coreVersion}`, () => {
    const harness = new Harness({
      directory: path.join(__dirname, 'collateral'),
      xformFolderPath: path.join(__dirname, 'collateral', 'forms'),
      verbose: false,
      reportFormErrors: false,
      coreVersion,
    });

    before(async () => { return await harness.start(); });
    after(async () => { return await harness.stop(); });
    beforeEach(async () => { return await harness.clear(); });
    afterEach(() => { expect(harness.consoleErrors).to.be.empty; });

    describe('getTasks', () => {
      beforeEach(async () => {
        await harness.clear();
        await harness.setNow('2000-01-01');
      });

      it('followup task present one day before schedule', async () => {
        expect(harness.coreVersion).to.eq(coreVersion);
        const formResult = await harness.fillForm('pnc_followup', ['no'], ['yes', '2000-01-07']);
        expect(formResult.errors).to.be.empty;

        await harness.setNow('2000-01-07');
        const tasks = await harness.getTasks();
        expect(tasks).to.have.property('length', 1);
        expect(tasks[0]._id).to.include('~org.couchdb.user:user_contact_id~');
        expect(tasks[0]).to.nested.include({
          owner: 'patient_id_data',
          requester: 'patient_id_data',
          state: 'Ready',
          'emission.dueDate': '2000-01-07',
          'emission.icon': 'newborn',
          'emission.actions[0].form': 'pnc_followup',
        });
      });
    
      it('followup task present three days after schedule', async () => {
        const formResult = await harness.fillForm('pnc_followup', ['no'], ['yes', '2000-01-07']);
        expect(formResult.errors).to.be.empty;

        await harness.setNow('2000-01-10');
        const tasks = await harness.getTasks();
        expect(tasks).to.have.property('length', 1);
        expect(tasks[0]).to.nested.include({ state: 'Ready' });
      });
    
      it('followup task not present at time of scheduling', async () => {
        const formResult = await harness.fillForm('pnc_followup', ['no'], ['yes', '2000-01-07']);
        expect(formResult.errors).to.be.empty;
        expect(await harness.getTasks()).to.be.empty;
      });
    });

    describe('loadAction', () => {
      
      beforeEach(async () => await harness.setNow('2000-01-01'));

      it('tasks action resolves task', async () => {
        const scheduledDate = '2000-01-07';
        const initialResult = await harness.fillForm('pnc_followup', ['no'], ['yes', scheduledDate]);
        expect(initialResult.errors).to.be.empty;
    
        await harness.setNow(scheduledDate);
        const tasks = await harness.getTasks();
        expect(tasks).to.have.property('length', 1);
        
        expect(tasks[0].emission.actions[0]).to.include({ forId: 'patient_id_data' });
        await harness.loadAction(tasks[0].emission.actions[0]);
        const followupResult = await harness.fillForm(['no_come_back']);
        expect(followupResult.errors).to.be.empty;

        // This data is the result of a build-time shim forced into enketo
        expect(followupResult.report).to.nested.include({
          'fields.inputs.source': 'task',
          'fields.inputs.source_id': initialResult.report._id,
        });
    
        const actual = await harness.getTasks();
        expect(actual).to.be.empty;
      });
    });
  });
}
