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

import SplashScreenPage from "../../../src/renderer/components/SplashScreenPage";
import { ipcRenderer, remote } from "electron";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

// Mock prototype and mixin bellow
localVue.prototype.$t = (text, args = "") => {
  return text + args;
}; // i18n mock
localVue.prototype.$tc = (text, args = "") => {
  return text + args;
}; // i18n mock
const routerPushMock = sm.mock();
localVue.prototype.$router = { push: routerPushMock }; // router mock
const showModalMock = sm.mock();
localVue.prototype.$bvModal = { show: showModalMock }; // bvModal mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

describe("SplashScreenPage template", () => {
  // define all var needed for the test here
  let wrapper;
  let storeConfigCopy;
  let store;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(SplashScreenPage, {
      localVue,
      store,
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("renders properly html element", () => {
    const elementSelector = "#splash-screen";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });
});

describe("SplashScreenPage mounted", () => {
  let wrapper;
  let store;
  let storeConfigCopy;
  let getCurrentWindowMock;
  let setContentSizeMock;
  let getContentSizeMock;
  let mockedWidth;
  let ipcOnMock;
  let ipcSendMock;

  beforeEach(() => {
    process.env["DEBUG"] = "electron-builder"; // force update check in dev mode for these tests
    mockedWidth = 100;
    setContentSizeMock = sm.mock();
    getContentSizeMock = sm.mock().returnWith([mockedWidth, 0]);
    getCurrentWindowMock = sm.mock(remote, "getCurrentWindow").returnWith({
      setContentSize: setContentSizeMock,
      getContentSize: getContentSizeMock,
    });
    ipcOnMock = sm.mock(ipcRenderer, "on").returnWith("");
    ipcSendMock = sm.mock(ipcRenderer, "send").returnWith("");

    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(SplashScreenPage, {
      localVue,
      store,
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
    routerPushMock.reset();
  });

  it("electron remote.setContentSize is called to set window size", () => {
    expect(getCurrentWindowMock.callCount).to.equal(1);
    expect(setContentSizeMock.callCount).to.equal(1);
    expect(setContentSizeMock.lastCall.args[0]).to.equal(mockedWidth); // come from getContentSize return, first item
    expect(setContentSizeMock.lastCall.args[1]).to.equal(
      wrapper.vm.windowHeight
    ); // come from windowHeight data
  });

  it("event listener are setup and setCSP, checkForUpdate event are sent", () => {
    expect(ipcOnMock.callCount).to.equal(5);

    expect(ipcOnMock.calls[0].arg).to.equal("updateNotAvailable");
    expect(ipcOnMock.calls[1].arg).to.equal("updateAvailable");
    expect(ipcOnMock.calls[2].arg).to.equal("downloadingUpdate");
    expect(ipcOnMock.calls[3].arg).to.equal("updateDownloaded");
    expect(ipcOnMock.calls[4].arg).to.equal("updateError");

    expect(ipcSendMock.callCount).to.equal(2);
    expect(ipcSendMock.calls[0].arg).to.equal("setCSP");
    expect(ipcSendMock.calls[1].arg).to.equal("checkForUpdate");
  });

  it("event updateNotAvailable callback call router", () => {
    expect(ipcOnMock.calls[0].arg).to.equal("updateNotAvailable");
    // check event callback
    const updateNotAvailableCallBack = ipcOnMock.calls[0].args[1];

    updateNotAvailableCallBack();

    expect(routerPushMock.callCount).to.equal(1);
    expect(routerPushMock.lastCall.arg).to.eql({ name: "login" });
  });

  it("event downloadingUpdate callback set proper data", () => {
    const mockedCurrent = 42;
    const mockedTotal = 99;
    expect(ipcOnMock.calls[2].arg).to.equal("downloadingUpdate");
    // check event callback
    const downloadingUpdateCallBack = ipcOnMock.calls[2].args[1];

    downloadingUpdateCallBack("fakeEvent", mockedCurrent, mockedTotal);

    expect(wrapper.vm.downloadingUpdate).to.equal(true);
    expect(wrapper.vm.downloadCurrentProgress).to.equal(mockedCurrent);
    expect(wrapper.vm.downloadTotalProgress).to.equal(mockedTotal);
  });

  it("event update-downloaded callback set proper data", () => {
    const mockedTotal = 98;
    wrapper.setData({ downloadTotalProgress: mockedTotal });
    expect(ipcOnMock.calls[3].arg).to.equal("updateDownloaded");
    // check event callback
    const updateDownloadedCallBack = ipcOnMock.calls[3].args[1];

    updateDownloadedCallBack();

    expect(wrapper.vm.downloadCurrentProgress).to.equal(mockedTotal);
  });

  it("event updateError callback call router", () => {
    expect(ipcOnMock.calls[4].arg).to.equal("updateError");
    // check event callback
    const updateErrorCallBack = ipcOnMock.calls[4].args[1];

    updateErrorCallBack();

    expect(routerPushMock.callCount).to.equal(1);
    expect(routerPushMock.lastCall.arg).to.eql({ name: "login" });
  });
});
