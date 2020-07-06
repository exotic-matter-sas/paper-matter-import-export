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
import * as tv from "../../tools/testValues.js";

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
  let computed;

  let fakeWidth;
  let setContentSizeMock;
  let getContentSizeMock;
  let getCurrentWindowMock;
  let docsToImportMock;
  let importDocsInErrorMock;
  let docsToExportMock;
  let exportDocsInErrorMock;

  beforeEach(() => {
    fakeWidth = 100;
    setContentSizeMock = sm.mock();
    getContentSizeMock = sm.mock().returnWith([fakeWidth, 0]);
    getCurrentWindowMock = sm.mock(remote, "getCurrentWindow").returnWith(
      {setContentSize: setContentSizeMock, getContentSize: getContentSizeMock}
    );
    docsToImportMock = sm.mock().returnWith([]);
    importDocsInErrorMock = sm.mock().returnWith([]);
    docsToExportMock = sm.mock().returnWith([]);
    exportDocsInErrorMock = sm.mock().returnWith([]);
    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    computed = {
      docsToImport: {
        cache: false,
        get: docsToImportMock
      },
      importDocsInError: {
        cache: false,
        get: importDocsInErrorMock
      },
      docsToExport: {
        cache: false,
        get: docsToExportMock
      },
      exportDocsInError: {
        cache: false,
        get: exportDocsInErrorMock
      },
    }
  });

  afterEach(() => {
    sm.restore();
    docsToImportMock.actions = [];
    importDocsInErrorMock.actions = [];
    docsToExportMock.actions = [];
    exportDocsInErrorMock.actions = [];
  });

  it("electron remote.setContentSize is called to set window size", () => {
    wrapper = shallowMount(HomePage, {
      localVue,
      store,
      computed
    });

    expect(getCurrentWindowMock.callCount).to.equal(1);
    expect(setContentSizeMock.callCount).to.equal(1);
    expect(setContentSizeMock.lastCall.args[0]).to.equal(fakeWidth); // come from getContentSize return, first item
    expect(setContentSizeMock.lastCall.args[1]).to.equal(wrapper.vm.windowHeight); // come from windowHeight data
  });

  it("askForActionRetry is set if it left docsToImport", () => {
    docsToImportMock.actions = [];
    docsToImportMock.returnWith([tv.DOCUMENT_PROPS]);
    wrapper = shallowMount(HomePage, {
      localVue,
      store,
      computed
    });

    expect(wrapper.vm.askForActionRetry).to.equal(true);
  });

  it("askForActionRetry is set if there is importDocsInError", () => {
    importDocsInErrorMock.actions = [];
    importDocsInErrorMock.returnWith([tv.DOCUMENT_PROPS]);
    wrapper = shallowMount(HomePage, {
      localVue,
      store,
      computed
    });

    expect(wrapper.vm.askForActionRetry).to.equal(true);
  });

  it("askForActionRetry is set if it left docsToExportMock", () => {
    docsToExportMock.actions = [];
    docsToExportMock.returnWith([tv.DOCUMENT_PROPS]);
    wrapper = shallowMount(HomePage, {
      localVue,
      store,
      computed
    });

    expect(wrapper.vm.askForActionRetry).to.equal(true);
  });

  it("askForActionRetry is set if there is exportDocsInErrorMock", () => {
    exportDocsInErrorMock.actions = [];
    exportDocsInErrorMock.returnWith([tv.DOCUMENT_PROPS]);
    wrapper = shallowMount(HomePage, {
      localVue,
      store,
      computed
    });

    expect(wrapper.vm.askForActionRetry).to.equal(true);
  });
});

describe("HomePage methods", () => {
  let wrapper;
  let storeConfigCopy;
  let store;
  let disconnectUserMock;
  let setImportDestinationMock;
  let setExportSourceMock;
  let resetImportdataMock;
  let resetExportDataMock;
  let actionMock;

  beforeEach(() => {
    disconnectUserMock = sm.mock();
    setImportDestinationMock = sm.mock();
    setExportSourceMock = sm.mock();
    resetImportdataMock = sm.mock();
    resetExportDataMock = sm.mock();
    actionMock = sm.mock().returnWith('import');
    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.auth.actions.disconnectUser = disconnectUserMock;
    storeConfigCopy.modules.import.mutations.SET_IMPORT_DESTINATION = setImportDestinationMock;
    storeConfigCopy.modules.export.mutations.SET_EXPORT_SOURCE = setExportSourceMock;
    storeConfigCopy.modules.import.mutations.RESET_IMPORT_DATA = resetImportdataMock;
    storeConfigCopy.modules.export.mutations.RESET_EXPORT_DATA = resetExportDataMock;
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(HomePage, {
      localVue,
      store,
      computed: {
        action: {
          cache: false,
          get: actionMock
        },
      }
    });
  });

  afterEach(() => {
    sm.restore();
    actionMock.actions = [];
  });

  it("disconnectUser call disconnectUser action", () => {
    wrapper.vm.disconnectUser();

    expect(disconnectUserMock.callCount).to.equal(1);
  });

  it("saveFolderPickerSelection commit data to proper store", async () => {
    let fakeDestinationFolder = 'fakeDestinationFolder';
    // given current tab is import (default action)
    wrapper.vm.saveFolderPickerSelection(fakeDestinationFolder);

    expect(setImportDestinationMock.callCount).to.equal(1);
    expect(setImportDestinationMock.lastCall.args[1]).to.equal(fakeDestinationFolder);

    // given current tab is export
    actionMock.actions = [];
    actionMock.returnWith('export');

    wrapper.vm.saveFolderPickerSelection(fakeDestinationFolder);

    expect(setExportSourceMock.callCount).to.equal(1);
    expect(setExportSourceMock.lastCall.args[1]).to.equal(fakeDestinationFolder);
  });

  it("updateActionProgress set proper values", () => {
    const fakeCurrentCount = 1;
    const fakeTotalCount = 42;
    wrapper.vm.updateActionProgress({currentCount: fakeCurrentCount, totalCount: fakeTotalCount});

    expect(wrapper.vm.ongoingAction).to.equal(true);
    expect(wrapper.vm.currentCount).to.equal(fakeCurrentCount);
    expect(wrapper.vm.totalCount).to.equal(fakeTotalCount);
  });

  it("hideImportProgress set proper values", () => {
    wrapper.vm.hideImportProgress();

    expect(wrapper.vm.ongoingAction).to.equal(false);
    expect(wrapper.vm.currentStep).to.equal(1);
    expect(wrapper.vm.totalCount).to.equal(0);
    expect(wrapper.vm.actionInterrupted).to.equal(false);
  });

  it("performActionRetry set proper values", () => {
    // given action is import
    wrapper.setData({action: 'import'});

    wrapper.vm.performActionRetry();

    expect(wrapper.vm.performImportRetry).to.equal(true);

    wrapper.setData({action: 'export'});

    wrapper.vm.performActionRetry();

    expect(wrapper.vm.performImportRetry).to.equal(true);
  });

  it("resetAllData set proper values", () => {
    wrapper.vm.resetAllData();

    expect(resetImportdataMock.callCount).to.eql(1);
    expect(resetExportDataMock.callCount).to.eql(1);
  });
});
