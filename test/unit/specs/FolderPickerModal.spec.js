/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { createLocalVue, shallowMount } from "@vue/test-utils";
import sm from "simple-mock"

import BootstrapVue from "bootstrap-vue";
import Vuex from "vuex";
import storeConfig from "../../../src/renderer/store";
import cloneDeep from "lodash.clonedeep";

import FolderPickerModal from "../../../src/renderer/components/HomePage/FolderPickerModal";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

// Mock prototype and mixin bellow
localVue.prototype.$t = (text, args = "") => {
  return text + args;
}; // i18n mock
localVue.prototype.$tc = (text, args = "") => {
  return text + args;
}; // i18n mock
const showModalMock = sm.mock();
const hideModalMock = sm.mock();
localVue.prototype.$bvModal = { show: showModalMock, hide: hideModalMock}; // bvModal mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings


describe("FolderPickerModal template", () => {
  // define all var needed for the test here
  let wrapper;
  let store;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(FolderPickerModal, {
      localVue,
      store,
      props: {
        action: 'import'
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("renders properly html element", () => {
    const elementSelector = "#folder-picker-modal";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });
});

describe("FolderPickerModal mounted", () => {
  let wrapper;
  let store;
  let savedImportDestinationMock;
  let mockedSavedImportDestination;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    mockedSavedImportDestination = 'fakeImportDestination';
    savedImportDestinationMock = sm.mock().returnWith(mockedSavedImportDestination);

    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(FolderPickerModal, {
      localVue,
      store,
      props: {
        action: 'import'
      },
      computed: {
        savedImportDestination: {
          cache: false,
          get: savedImportDestinationMock
        },
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
    savedImportDestinationMock.actions = [];
  });

  it("modal is shown and proper values are set", () => {
    expect(showModalMock.callCount).to.equal(1);
    expect(showModalMock.lastCall.args[0]).to.equal('folder-picker-modal');
    expect(wrapper.vm.unSavedImportDestination).to.equal(mockedSavedImportDestination);
  });
});

describe("FolderPickerModal methods", () => {
  let wrapper;
  let store;
  let storeConfigCopy;
  let setImportDestinationMock;
  let mockedSavedImportDestination;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    setImportDestinationMock = sm.mock();
    mockedSavedImportDestination = 'fakeImportDestination';

    // Copy store config to mock some mutations and actions
    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.import.mutations.SET_IMPORT_DESTINATION = setImportDestinationMock;
    store = new Vuex.Store(storeConfigCopy);

    wrapper = shallowMount(FolderPickerModal, {
      localVue,
      store,
      props: {
        action: 'import'
      },
    });
  });

  afterEach(() => {
    sm.restore();
    hideModalMock.reset();
  });

  it("saveFolderPick commit import destination to store", () => {
    wrapper.setData({unSavedImportDestination: mockedSavedImportDestination});

    wrapper.vm.saveFolderPick();

    expect(setImportDestinationMock.callCount).to.be.equal(1);
    expect(setImportDestinationMock.lastCall.args[1]).to.be.equal(mockedSavedImportDestination);
  });

  it("saveFolderPick call $bvModal.hide", () => {
    wrapper.setData({unSavedImportDestination: mockedSavedImportDestination});

    wrapper.vm.saveFolderPick();

    expect(hideModalMock.callCount).to.be.equal(1);
    expect(hideModalMock.lastCall.arg).to.be.equal('folder-picker-modal');
  });
});
