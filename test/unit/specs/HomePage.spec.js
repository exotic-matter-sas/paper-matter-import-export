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


import HomePage from "../../../src/renderer/components/HomePage";

import {remote} from "electron";
import {USER_PROPS} from "../../tools/testValues";
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

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

describe("HomePage template", () => {
  let wrapper;
  let storeConfigCopy;
  let store;

  beforeEach(() => {
    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    const accountNameMock = sm.mock().returnWith(USER_PROPS.email);

    wrapper = shallowMount(HomePage, {
      localVue,
      store,
      computed: {
        accountName: accountNameMock
      }
    });
  });

  afterEach(() => {
    sm.restore();
  });

  it("renders properly html element", () => {
    const elementSelector = "#logged-header";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });

  it("renders properly component data", async () => {
    expect(wrapper.text()).to.contains(USER_PROPS.email);
  });
});

describe("HomePage mounted", () => {
  let wrapper;
  let store;
  let storeConfigCopy;

  let fakeWidth;
  let setContentSizeMock;
  let getContentSizeMock;
  let getCurrentWindowMock;

  beforeEach(() => {
    fakeWidth = 100;
    setContentSizeMock = sm.mock();
    getContentSizeMock = sm.mock().returnWith([fakeWidth, 0]);
    getCurrentWindowMock = sm.mock(remote, "getCurrentWindow").returnWith(
      {setContentSize: setContentSizeMock, getContentSize: getContentSizeMock}
    );
    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(HomePage, {
      localVue,
      store,
    });
  });

  afterEach(() => {
    sm.restore();
  });

  it("electron remote.setContentSize is called to set window size", () => {
    expect(getCurrentWindowMock.callCount).to.equal(1);
    expect(setContentSizeMock.callCount).to.equal(1);
    expect(setContentSizeMock.lastCall.args[0]).to.equal(fakeWidth); // come from getContentSize return, first item
    expect(setContentSizeMock.lastCall.args[1]).to.equal(wrapper.vm.windowHeight); // come from windowHeight data
  });
});

describe("HomePage methods", () => {
  let wrapper;
  let storeConfigCopy;
  let store;
  let disconnectUserMock;
  let setImportDestinationMock;
  let setExportSourceMock;

  beforeEach(() => {
    disconnectUserMock = sm.mock();
    setImportDestinationMock = sm.mock();
    setExportSourceMock = sm.mock();
    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.auth.actions.disconnectUser = disconnectUserMock;
    storeConfigCopy.modules.import.mutations.SET_IMPORT_DESTINATION = setImportDestinationMock;
    storeConfigCopy.modules.export.mutations.SET_EXPORT_SOURCE = setExportSourceMock;
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(HomePage, {
      localVue,
      store,
    });
  });

  afterEach(() => {
    sm.restore();
  });

  it("disconnectUser call disconnectUser action", () => {
    wrapper.vm.disconnectUser();

    expect(disconnectUserMock.callCount).to.equal(1);
  });

  it("saveFolderPickerSelection commit data to proper store", async () => {
    let fakeDestinationFolder = 'fakeDestinationFolder';
    // given current tab is import
    wrapper.setData({actionType: 'import'});

    wrapper.vm.saveFolderPickerSelection(fakeDestinationFolder);

    expect(setImportDestinationMock.callCount).to.equal(1);
    expect(setImportDestinationMock.lastCall.args[1]).to.equal(fakeDestinationFolder);

    // given current tab is export
    wrapper.setData({actionType: 'export'});

    wrapper.vm.saveFolderPickerSelection(fakeDestinationFolder);

    expect(setExportSourceMock.callCount).to.equal(1);
    expect(setExportSourceMock.lastCall.args[1]).to.equal(fakeDestinationFolder);
  });

  it("displayImportProgress set proper values", () => {
    const fakeTotalCount = 42;
    wrapper.vm.displayImportProgress(fakeTotalCount);

    expect(wrapper.vm.actionOnGoing).to.equal(true);
    expect(wrapper.vm.totalCount).to.equal(fakeTotalCount);
  });

  it("interruptImport call set importInterrupted to true", () => {
    wrapper.vm.interruptImport();

    expect(wrapper.vm.importInterrupted).to.equal(true);
  });

  it("hideImportProgress set proper values", () => {
    wrapper.vm.hideImportProgress();

    expect(wrapper.vm.actionOnGoing).to.equal(false);
    expect(wrapper.vm.totalCount).to.equal(0);
    expect(wrapper.vm.importInterrupted).to.equal(false);
  });
});
