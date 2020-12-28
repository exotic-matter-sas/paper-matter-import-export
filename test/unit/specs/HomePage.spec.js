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

import HomePage from "../../../src/renderer/components/HomePage";

import { remote } from "electron";
import { USER_PROPS } from "../../tools/testValues";
import * as tv from "../../tools/testValues.js";
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
const mockedGetUserDataResponse = {
  data: {
    email: "fake@email.com",
  },
};
let getUserDataMock = sm.mock().resolveWith(mockedGetUserDataResponse);
let apiMock = { getUserData: getUserDataMock };
localVue.prototype.$api = apiMock;

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
        accountName: accountNameMock,
      },
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
  let mockedWidth;
  let setContentSizeMock;
  let getContentSizeMock;
  let getCurrentWindowMock;
  let setAccountNameMock;
  let accessTokenMock;
  let mockedAccessToken;

  beforeEach(() => {
    mockedWidth = 100;
    mockedAccessToken = "fakeAccessToken";
    setContentSizeMock = sm.mock();
    getContentSizeMock = sm.mock().returnWith([mockedWidth, 0]);
    getCurrentWindowMock = sm.mock(remote, "getCurrentWindow").returnWith({
      setContentSize: setContentSizeMock,
      getContentSize: getContentSizeMock,
    });
    setAccountNameMock = sm.mock();
    accessTokenMock = sm.mock().returnWith(mockedAccessToken);
    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.auth.mutations.SET_ACCOUNT_NAME = setAccountNameMock;
    store = new Vuex.Store(storeConfigCopy);
  });

  afterEach(() => {
    sm.restore();
    getUserDataMock.reset();
  });

  it("electron remote.setContentSize is called to set window size", () => {
    wrapper = shallowMount(HomePage, {
      localVue,
      store,
      computed: {
        accessToken: accessTokenMock,
      },
    });

    expect(getCurrentWindowMock.callCount).to.equal(1);
    expect(setContentSizeMock.callCount).to.equal(1);
    expect(setContentSizeMock.lastCall.args[0]).to.equal(mockedWidth); // come from getContentSize return, first item
    expect(setContentSizeMock.lastCall.args[1]).to.equal(
      wrapper.vm.windowHeight
    ); // come from windowHeight data
  });

  it("getUserData api is called and SET_ACCOUNT_NAME is commit", async () => {
    wrapper = shallowMount(HomePage, {
      localVue,
      store,
      computed: {
        accessToken: accessTokenMock,
      },
    });

    await flushPromises();

    expect(getUserDataMock.callCount).to.equal(1);
    expect(getUserDataMock.lastCall.arg).to.equal(mockedAccessToken);

    expect(setAccountNameMock.callCount).to.equal(1);
    expect(setAccountNameMock.lastCall.args[1]).to.equal(
      mockedGetUserDataResponse.data.email
    );
  });

  it("getUserData errors are handled handled", async () => {
    // given
    getUserDataMock.actions = [];
    getUserDataMock.rejectWith("Boom!");
    wrapper = shallowMount(HomePage, {
      localVue,
      store,
      computed: {
        accessToken: accessTokenMock,
      },
    });

    await flushPromises();

    expect(getUserDataMock.callCount).to.equal(1);
    expect(getUserDataMock.lastCall.arg).to.equal(mockedAccessToken);

    expect(setAccountNameMock.callCount).to.equal(1);
    expect(setAccountNameMock.lastCall.args[1]).to.equal("?");
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
  let docsToImportMock;
  let importDocsInErrorMock;
  let docsToExportMock;
  let exportDocsInErrorMock;
  let displayRetryModalIfNeededMock;

  beforeEach(() => {
    disconnectUserMock = sm.mock();
    setImportDestinationMock = sm.mock();
    setExportSourceMock = sm.mock();
    resetImportdataMock = sm.mock();
    resetExportDataMock = sm.mock();
    displayRetryModalIfNeededMock = sm.mock();
    actionMock = sm.mock().returnWith("import");
    docsToImportMock = sm.mock().returnWith([]);
    importDocsInErrorMock = sm.mock().returnWith([]);
    docsToExportMock = sm.mock().returnWith([]);
    exportDocsInErrorMock = sm.mock().returnWith([]);
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
          get: actionMock,
        },
        docsToImport: {
          cache: false,
          get: docsToImportMock,
        },
        importDocsInError: {
          cache: false,
          get: importDocsInErrorMock,
        },
        docsToExport: {
          cache: false,
          get: docsToExportMock,
        },
        exportDocsInError: {
          cache: false,
          get: exportDocsInErrorMock,
        },
      },
      methods: {
        displayRetryModalIfNeeded: displayRetryModalIfNeededMock,
      },
    });
  });

  afterEach(() => {
    sm.restore();
    actionMock.actions = [];
    docsToImportMock.actions = [];
    importDocsInErrorMock.actions = [];
    docsToExportMock.actions = [];
    exportDocsInErrorMock.actions = [];
  });

  it("logout call disconnectUser action", () => {
    wrapper.vm.logout();

    expect(disconnectUserMock.callCount).to.equal(1);
    expect(disconnectUserMock.lastCall.args[1]).to.eql({
      apiClient: wrapper.vm.$api,
      reason: "user disconnect himself",
    });
  });

  it("saveFolderPickerSelection commit data to proper store", async () => {
    let fakeDestinationFolder = "fakeDestinationFolder";
    // given current tab is import (default action)
    wrapper.vm.saveFolderPickerSelection(fakeDestinationFolder);

    expect(setImportDestinationMock.callCount).to.equal(1);
    expect(setImportDestinationMock.lastCall.args[1]).to.equal(
      fakeDestinationFolder
    );

    // given current tab is export
    actionMock.actions = [];
    actionMock.returnWith("export");

    wrapper.vm.saveFolderPickerSelection(fakeDestinationFolder);

    expect(setExportSourceMock.callCount).to.equal(1);
    expect(setExportSourceMock.lastCall.args[1]).to.equal(
      fakeDestinationFolder
    );
  });

  it("updateActionProgress set proper values", () => {
    const fakeCurrentCount = 1;
    const fakeTotalCount = 42;
    wrapper.vm.updateActionProgress({
      currentCount: fakeCurrentCount,
      totalCount: fakeTotalCount,
    });

    expect(wrapper.vm.ongoingAction).to.equal(true);
    expect(wrapper.vm.currentCount).to.equal(fakeCurrentCount);
    expect(wrapper.vm.totalCount).to.equal(fakeTotalCount);
  });

  it("resetActionProgress set proper values", () => {
    wrapper.vm.resetActionProgress();

    expect(wrapper.vm.ongoingAction).to.equal(false);
    expect(wrapper.vm.currentStep).to.equal(1);
    expect(wrapper.vm.totalCount).to.equal(0);
    expect(wrapper.vm.actionInterrupted).to.equal(false);
  });

  it("performActionRetry set proper values", () => {
    // given action is import
    wrapper.setData({ action: "import" });

    wrapper.vm.performActionRetry();

    expect(wrapper.vm.performImportRetry).to.equal(true);

    wrapper.setData({ action: "export" });

    wrapper.vm.performActionRetry();

    expect(wrapper.vm.performImportRetry).to.equal(true);
  });

  it("displayRetryModalIfNeeded set askForActionRetry if it left docsToImport", () => {
    importDocsInErrorMock.actions = [];
    importDocsInErrorMock.returnWith([tv.DOCUMENT_PROPS]);
    // restore original method to test it
    wrapper.setMethods({
      displayRetryModalIfNeeded: HomePage.methods.displayRetryModalIfNeeded,
    });

    wrapper.vm.displayRetryModalIfNeeded();

    expect(wrapper.vm.askForActionRetry).to.equal(true);
  });

  it("displayRetryModalIfNeeded set askForActionRetry if there is importDocsInError", () => {
    importDocsInErrorMock.actions = [];
    importDocsInErrorMock.returnWith([tv.DOCUMENT_PROPS]);
    // restore original method to test it
    wrapper.setMethods({
      displayRetryModalIfNeeded: HomePage.methods.displayRetryModalIfNeeded,
    });

    wrapper.vm.displayRetryModalIfNeeded();

    expect(wrapper.vm.askForActionRetry).to.equal(true);
  });

  it("displayRetryModalIfNeeded set askForActionRetry if it left docsToExportMock", () => {
    docsToExportMock.actions = [];
    docsToExportMock.returnWith([tv.DOCUMENT_PROPS]);
    // restore original method to test it
    wrapper.setMethods({
      displayRetryModalIfNeeded: HomePage.methods.displayRetryModalIfNeeded,
    });

    wrapper.vm.displayRetryModalIfNeeded();

    expect(wrapper.vm.askForActionRetry).to.equal(true);
  });

  it("displayRetryModalIfNeeded set askForActionRetry if there is exportDocsInErrorMock", () => {
    exportDocsInErrorMock.actions = [];
    exportDocsInErrorMock.returnWith([tv.DOCUMENT_PROPS]);
    // restore original method to test it
    wrapper.setMethods({
      displayRetryModalIfNeeded: HomePage.methods.displayRetryModalIfNeeded,
    });

    wrapper.vm.displayRetryModalIfNeeded();

    expect(wrapper.vm.askForActionRetry).to.equal(true);
  });

  it("resetAllData set proper values", () => {
    wrapper.vm.resetAllData();

    expect(resetImportdataMock.callCount).to.eql(1);
    expect(resetExportDataMock.callCount).to.eql(1);
  });
});
