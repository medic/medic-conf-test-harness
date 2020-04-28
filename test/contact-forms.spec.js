const chai = require('chai');
const moment = require('moment');
const chaiExclude = require('chai-exclude');
const path = require('path');
const Harness = require('../src/harness');

chai.use(chaiExclude);
const { expect } = chai;


const harness = new Harness({
  directory: path.join(__dirname, 'collateral'),
  xformFolderPath: path.join(__dirname, 'collateral', 'forms'),
  verbose: false,
  reportFormErrors: false,
});

describe('contact forms', () => {
  before(async () => { return await harness.start(); });
  after(async () => { return await harness.stop(); });
  beforeEach(async () => { return await harness.clear(); });
  afterEach(() => { expect(harness.consoleErrors).to.be.empty; });

  it('district-hospital with new primary contact', async () => {
    const now = moment('2000-01-01');
    await harness.setNow(now.valueOf());
    const result = await harness.fillContactForm(
      'district_hospital',
      ['new_person', 'Full', 'Short', '1990-08-06', undefined, '+1-555-227-7744', undefined, 'female', 'patient'],
      ['yes']
    );
    expect(result.errors).to.be.empty;
    expect(result.contacts).excluding(['_id', 'meta']).to.deep.eq([
      {
        contact: {
          _id: result.contacts[1]._id,
        },
        external_id: '',
        geolocation: '',
        is_name_generated: 'true',
        name: "'s Health Facility", // actual bug in form
        notes: '',
        parent: {},
        reported_date: now.valueOf(),
        type: 'district_hospital',
      },
      {
        date_of_birth: '1990-08-06',
        date_of_birth_method: '',
        ephemeral_dob: {
          dob_approx: '2000-01-01',
          dob_calendar: '1990-08-06',
          dob_iso: '1990-08-06',
          dob_method: '',
          dob_raw: '1990-08-06',
          ephemeral_months: '1',
          ephemeral_years: '2000',
        },
        external_id: '',
        name: 'Full',
        notes: '',
        parent: {
          _id: result.contacts[0]._id,
          parent: {}
        },
        phone: '+1-555-227-7744',
        phone_alternate: '',
        reported_date: now.valueOf(),
        role: 'patient',
        sex: 'female',
        short_name: 'Short',
        type: 'person',
      },
    ]);
  });

  it('msf-niger investigator', async () => {
    const result = await harness.fillContactForm('investigator', ['Mr. Investigator']);
    expect(result.errors).to.be.empty;

    expect(result.contacts.length).to.eq(2);
    expect(result.contacts[0]).to.deep.include({
      contact: {
        _id: result.contacts[1]._id,
      },
      name: 'Mr. Investigator',
      type: 'contact',
      contact_type: 'investigator',
    });

    expect(result.contacts[1]).to.deep.include({
      name: 'Mr. Investigator',
      type: 'contact',
      parent: {
        _id: result.contacts[0]._id,
        parent: {},
      },
      contact_type: 'person',
    });

    expect(harness.state.contacts).to.deep.include(result.contacts[0]);
    expect(harness.state.contacts).to.deep.include(result.contacts[1]);
  });

  it('form without pages', async () => {
    const now = moment('2000-01-01');
    await harness.setNow(now.valueOf());
    const result = await harness.fillContactForm('no_pages', [
      undefined,
      'chw', '123', 'full name', '1990-10-08', undefined, 'male', '555-123-4567', 'no', 'english',
      'yes', 'second', 'no', 'unknown', ['diabetes'], 'true', 'notes'
    ]);
    expect(result.errors).to.be.empty;

    expect(result.contacts[0]).to.deep.include({
      type: 'contact',
      role: 'chw',
      arv_number: '123',
      name: 'full name',
      date_of_birth: '1990-10-08',
      date_of_birth_method: '',
      ephemeral_dob: {
        dob_calendar: '1990-10-08',
        dob_method: '',
        ephemeral_months: '1',
        ephemeral_years: '2000',
        dob_approx: '2000-01-01',
        dob_raw: '1990-10-08',
        dob_iso: '1990-10-08'
      },
      sex: 'male',
      phone: '555-123-4567',
      shared_phone: '',
      preferred_language: '',
      arv: { arv_status: 'yes', arv_line: 'second', stable: 'no' },
      tb: { tb_status: 'unknown' },
      chronic_disease: 'diabetes',
      opt_out: 'yes',
      notes: 'notes',
      contact_type: 'no_pages',
      reported_date: now.valueOf()
    });
  });
});
