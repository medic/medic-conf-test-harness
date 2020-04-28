const { expect } = require('chai');
const path = require('path');
const Harness = require('../src/harness');

const harness = new Harness({
  directory: path.join(__dirname, 'collateral'),
  xformFolderPath: path.join(__dirname, 'collateral', 'forms'),
  verbose: false,
  reportFormErrors: false,
});

describe('forms that have caused bugs', () => {
  before(async () => { return await harness.start(); });
  after(async () => { return await harness.stop(); });
  beforeEach(async () => { return await harness.clear(); });
  afterEach(() => { expect(harness.consoleErrors).to.be.empty; });

  it('patient_assessment with user-based fields', async () => {
    const mrdtUser = Object.assign({}, harness.defaultUser, { is_in_mrdt: true });
    const result = await harness.fillForm({ form: 'patient_assessment_over_5', user: mrdtUser },
      ['home_visit'],
      ['c_assessment_time_2', 'c_when_illness_2'],
      ['yes', ...Array(8).fill('no'), 'unavailable', 'watching'],
      [37],
      ['yes']);
    expect(result.errors).to.be.empty;
    expect(result.report.fields.inputs.user.is_in_mrdt).to.eq('true');
  });

  const pregnancyFormAnswers = [
    ['method_lmp'],
    ['1999-08-01'], [], ['4'],
    ['no', 'no', 'no', 'no'], // this is the page with the repeating multi-select
    ['no'], [], ['no', 'no'], ['none', 'no'], Array(11).fill('no'), ['no'],
    ['no'], [], ['no'], ['no'], []
  ];

  it('repeating prompt all nos', async () => {
    await harness.setNow('1999-10-10');
    const result = await harness.fillForm('pregnancy', ...pregnancyFormAnswers); 
    expect(result.errors).to.be.empty;
  });

  it('repeating prompt with answers', async () => {
    await harness.setNow('1999-10-10');
    const withAnswers = Object.assign(pregnancyFormAnswers, { 4: ['yes', '2020-09-01', 'no', 'no', 'no'] });
    const result = await harness.fillForm('pregnancy', ...withAnswers); 
    expect(result.errors[0].msg).to.include('Date must be within this pregnancy and cannot be in the future.');
  });

  it('form with many nested .or repeating prompts', async () => {
    const oneChildHealth = [
      ['alive_well'],
      Array(5).fill('no'),
      ['1', '1', '1999-09-15', 'health_facility', 'vaginal', 'skilled'],
      ['alive_well', 'Baby-1', 'female', 'yes', '2500', 'yes', '45', 'bcg_and_birth_polio', 'yes', 'yes'].concat(Array(9).fill('no')),
      [],
      ['within_24_hrs'],
      []
    ];

    await harness.setNow('1999-10-10');
    const result = await harness.fillForm('subfolder/delivery', ...oneChildHealth);
    expect(result.errors).to.be.empty;
    expect(result.report.form).to.eq('delivery');
  });

  it('d-tree postpartum form adds element "above" the first question', async () => {
    const inputs = [
      [], [], [], Array(3).fill('no'), Array(15).fill('yes'), [], [], [], []
    ];
    const result = await harness.fillForm('dtree-table-list', ...inputs);

    expect(result.errors).to.be.empty;
    expect(result.report.fields).to.deep.include({
      refer_postpartum_emergency_danger_sign_flag: '0',
    });
  });

  it('d-tree infant child form attempts to fill questions in disabled section of form', async () => {
    const inputs = [
      [],
      ['yes'],
      [],
      Array(10).fill('yes'),
      ['green','present'],
      ['no'],
      ['mother', 'stage_9mo_to_12mo', 'yes', 'does_not_talk'],
      ['moves', 'yes', 'no'],
      ['no','no','played','mother','2','no','no','no','no', '5', 'no', '1', '1', 'yes', 'no'],
      ['no'],
      ['no'],
      [],
      ['no'],
      []		
    ];

    const result = await harness.fillForm('dtree-infant-child', ...inputs);
    expect(result.errors).to.be.empty;
  });

  it('standard "on" form - contains textarea note', async () => {
    const result = await harness.fillForm('on', ['yes', 'this is a note']);
    expect(result.errors).to.be.empty;
  });

  it('db-doc=true yields additionalDoc', async () => {
    const now = new Date('2000-01-01');
    await harness.setNow(now);

    expect(harness.state.reports).to.have.property('length', 0);
    const result = await harness.fillForm('add_doc', ['rellocation', 'yes']);
    expect(result.errors).to.be.empty;
    expect(result.report).to.nested.include({
      form: 'add_doc',
      reported_date: now.getTime(),
      'fields.group_muting.reason_for_muting': 'rellocation',
      'fields.group_muting.muting_confirm': 'yes',
    });

    expect(result.additionalDocs).to.have.property('length', 1);
    expect(result.additionalDocs[0]).to.nested.include({
      type: 'data_record',
      content_type: 'xml',
      created_by_doc: result.report._id,
      reported_date: now.getTime(),
      form: 'muting-approve-request',
      'fields.muting_reason': 'rellocation',
      'fields.name': 'Patient Name',
    });
    expect(harness.state.reports).to.deep.eq([
      result.report,
      result.additionalDocs[0],
    ]);
  });

  it('support for input type tel', async () => {
    const result = await harness.fillForm('tel', [1, '17786043495']);
    expect(result.errors).to.be.empty;
    expect(result.report).to.nested.deep.include({
      form: 'tel',
      'fields.contacts.n_contacts': '',
      'fields.contacts.contact_repeat': [
        { text: '17786043495' },
      ]
    });
  });

  it('null values are allowed in content object', async () => {
    const result = await harness.fillForm({ form: 'tel', content: { foo: null } }, [1, '17786043495']);
    expect(result.errors).to.be.empty;
    expect(result.report).to.nested.deep.include({ form: 'tel' });
  });

  describe('repeat section "+" button - #42', () => {
    it('valid input', async () => {
      const result = await harness.fillForm('plus_repeat', [3, 'one', 'two', 'three']);
      expect(result.errors).to.be.empty;
      expect(result.report).to.nested.deep.include({
        form: 'plus_repeat',
        'fields.contacts.n_contacts': '',
        'fields.contacts.contact_repeat': [
          {'text':'one'},
          {'text':'two'},
          {'text':'three'}
        ]
      });
    });

    it('throw on non-integer input', async () => {
      try {
        await harness.fillForm('plus_repeat', ['click']);
        expect.fail('to throw');
      } catch (err) {
        expect(err.message).to.include('answer which is an integer');
      }
    });

    it('no input is allowed', async () => {
      const result = await harness.fillForm('plus_repeat');
      expect(result.errors).to.be.empty;
      expect(result.report).to.nested.deep.include({
        form: 'plus_repeat',
        'fields.contacts': { n_contacts: '' },
      });
    });
  });

  it('cht-reference "delivery" form - repeat areas', async () => {
    await harness.setNow('2000-04-30');
    const oneChildHealthyOneDeceasedOneStillbirth = [
      ['alive_well'],
      Array(5).fill('no'),
      ['3', '1', '2000-04-22', 'health_facility', 'vaginal'],
      ['2000-04-22', 'health_facility', 'yes', '', '2000-04-23', 'home', 'no', ''],
      ['alive_well', 'Baby-1', 'female', 'yes', '2500', 'yes', '45', 'bcg_and_birth_polio', 'yes', 'yes'].concat(Array(9).fill('no')),
      [],
      ['within_24_hrs'],
      []
    ];
    const result = await harness.fillForm('delivery', ...oneChildHealthyOneDeceasedOneStillbirth);
    expect(result.errors).to.be.empty;
    expect(result.report.fields.babys_condition.baby_repeat).to.have.property('length', 1);
    expect(result.report.fields.baby_death.baby_death_repeat).to.have.property('length', 2);
  });
});
