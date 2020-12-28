/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { createLocalVue, shallowMount } from "@vue/test-utils";
import sm from "simple-mock";

import BootstrapVue from "bootstrap-vue";
import Vuex from "vuex";
import storeConfig from "../../../src/renderer/store";
import cloneDeep from "lodash.clonedeep";

import FolderPickerModal from "../../../src/renderer/components/HomePage/FolderPickerModal";
import flushPromises from "flush-promises";

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
localVue.prototype.$bvModal = { show: showModalMock, hide: hideModalMock }; // bvModal mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

const fakeModalTitle = "fakeModalTitle";

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
      propsData: {
        title: fakeModalTitle,
      },
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

  it("renders properly component data", () => {
    expect(wrapper.text()).to.contains(fakeModalTitle);
  });
});

describe("FolderPickerModal mounted", () => {
  let wrapper;
  let store;
  let fakeDefaultDestination;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    fakeDefaultDestination = "fakeDefaultDestination";

    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(FolderPickerModal, {
      localVue,
      store,
      propsData: {
        title: fakeModalTitle,
        defaultDestination: fakeDefaultDestination,
      },
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("modal is shown and proper values are set", () => {
    expect(showModalMock.callCount).to.equal(1);
    expect(showModalMock.lastCall.args[0]).to.equal("folder-picker-modal");
    expect(wrapper.vm.unsavedDestination).to.equal(fakeDefaultDestination);
  });
});

describe("FolderPickerModal methods", () => {
  let wrapper;
  let store;
  let fakeDefaultDestination;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    fakeDefaultDestination = "fakeDefaultDestination";

    store = new Vuex.Store(storeConfig);

    wrapper = shallowMount(FolderPickerModal, {
      localVue,
      store,
      propsData: {
        title: fakeModalTitle,
        defaultDestination: fakeDefaultDestination,
      },
    });
  });

  afterEach(() => {
    sm.restore();
    hideModalMock.reset();
  });

  it("savePickedFolder emit event-save-picked-folder", () => {
    const testedEvent = "event-save-picked-folder";

    // when
    wrapper.vm.savePickedFolder();

    // then
    expect(wrapper.emitted(testedEvent)).to.not.be.undefined;
    expect(wrapper.emitted(testedEvent).length).to.equal(1);
    expect(wrapper.emitted(testedEvent)[0]).to.be.eql([fakeDefaultDestination]);
  });

  it("savePickedFolder call $bvModal.hide", () => {
    wrapper.vm.savePickedFolder();

    expect(hideModalMock.callCount).to.be.equal(1);
    expect(hideModalMock.lastCall.arg).to.be.equal("folder-picker-modal");
  });
});
