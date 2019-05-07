// TODO: Create interfaces to inject this

module.exports = {
  user: {
    name: 'CHW',
    date_of_birth: '1971-03-10',
    phone: '+16043185484',
    alternate_phone: '',
    notes: '',
    is_active: true,
    reported_date: 1550559625153,
    type: 'person',
    parent: {
      name: 'CHP Area 001',
      parent: {
        _id: '7149fcd2-b3ff-4f5d-ab7d-185aa54c85ed'
      },
      contact: {
        name: 'CHP Area 001 Contact',
        date_of_birth: '1971-03-10',
        phone: '+16043185484',
        alternate_phone: '',
        notes: '',
        is_active: true,
        reported_date: 1550559625153,
        type: 'person',
        parent: {
          _id: 'e00adbfe-ab12-44e2-aa9c-db95cd6a4cc8',
          parent: {
            _id: '7149fcd2-b3ff-4f5d-ab7d-185aa54c85ed'
          }
        },
        _id: '5c287e6c-6359-4ab0-a90c-2347eb60c4db',
        _rev: '2-a5475fedfab0559c86337e145fd5ce1d'
      },
      external_id: 'External Area 001',
      notes: 'Very nice neighborhood.',
      type: 'health_center',
      reported_date: 1550559625153,
      _id: 'parent_id_data',
      _rev: '1-a'
    }
  },
  content: {
    source: 'action',
    contact: {
      person_id: '5c287e6c-6359-4ab0-a90c-2347eb60c4db',
      facility_type: '',
      branch: '',
      person_type: 'hors_zone_adult',
      type: 'person',
      parent: {
        _id: 'parent_id_data',
        parent: {
          _id: 'e00adbfe-ab12-44e2-aa9c-db95cd6a4cc8',
          parent: {
            _id: '7149fcd2-b3ff-4f5d-ab7d-185aa54c85ed'
          }
        }
      },
      name: 'Patient Name',
      role: 'patient',
      concession: '',
      menage: '',
      date_of_birth: '1970-07-09',
      date_of_birth_method: '',
      person_age_in_years: '48',
      person_age_in_months: '583',
      ephemeral_dob: {
        dob_calendar: '1970-07-09',
        dob_method: '',
        ephemeral_months: '2',
        ephemeral_years: '2019',
        dob_approx: '2019-02-21',
        dob_raw: '1970-07-09',
        dob_iso: '1970-07-09'
      },
      relation_to_parent: 'Fils/Fille',
      sex: 'female',
      phone: '',
      alternate_phone: '',
      external_id: '',
      geolocation: '',
      reported_date: 1550762498368,
      _id: 'patient_id_data',
      _rev: '1-b'
    }
  },
  contactSummary: {
    id: 'contact-summary',
    xmlStr: '<context><muted>false</muted></context>',
  },
};
