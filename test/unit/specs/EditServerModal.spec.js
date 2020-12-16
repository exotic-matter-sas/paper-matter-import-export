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

import EditServerModal from "../../../src/renderer/components/LoginPage/EditServerModal";
import {defaultPmHostName} from "../../../src/renderer/store/modules/config";
import {defaultClientId} from "../../../src/renderer/store/modules/auth";
import {ipcRenderer} from "electron";

const log = require('electron-log');

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

// Mock prototype and mixin bellow
localVue.prototype.$t = (text, args = "") => {
  return text + args;
}; // i18n mock
localVue.prototype.$tc = (text, args = "") => {
  return text + args;
}; // i18n mock
let apiUpdateServerDataMock = sm.mock();
let apiMock = {updateServerData: apiUpdateServerDataMock};
localVue.prototype.$api = apiMock; // api prototype mock
const routerPushMock = sm.mock();
localVue.prototype.$router = { push: routerPushMock }; // router mock
const showModalMock = sm.mock();
localVue.prototype.$bvModal = { show: showModalMock }; // bvModal mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

const mockedPmHostName = "https://example.com";
const mockedClientId = "fakeClientId";


describe("EditServerModal template", () => {
  // define all var needed for the test here
  let wrapper;
  let storeConfigCopy;
  let store;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(EditServerModal, {
      localVue,
      store
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("renders properly html element", () => {
    const elementSelector = "#edit-server-modal";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });
});

describe("EditServerModal mounted", () => {
  let wrapper;
  let store;
  let storeConfigCopy;
  let pmHostNameMock;
  let clientIdMock;

  beforeEach(() => {
    pmHostNameMock = sm.mock().returnWith(mockedPmHostName);
    clientIdMock = sm.mock().returnWith(mockedClientId);
    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(EditServerModal, {
      localVue,
      store,
      computed: {
        pmHostName: pmHostNameMock,
        clientId: clientIdMock
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("modal is shown and proper values are set", () => {
    expect(showModalMock.callCount).to.equal(1);
    expect(showModalMock.lastCall.args[0]).to.equal('edit-server-modal');

    expect(wrapper.vm.serverAddress).to.equal(mockedPmHostName);
    expect(wrapper.vm.serverInputPlaceholder).to.equal(defaultPmHostName);
    expect(wrapper.vm.clientIdModel).to.equal(mockedClientId);
    expect(wrapper.vm.clientIdInputPlaceholder).to.equal(defaultClientId);
  });
});

describe("EditServerModal methods", () => {
  let wrapper;
  let storeConfigCopy;
  let store;
  let bvModalEvtMock;
  let setPmHostNameMock;
  let setClientIdMock;
  let pmHostNameMock;
  let clientIdMock;
  let ipcSendMock;
  let logInfoMock;

  beforeEach(() => {
    bvModalEvtMock = {preventDefault: sm.mock()};
    setPmHostNameMock = sm.mock();
    setClientIdMock = sm.mock();
    pmHostNameMock = sm.mock().returnWith(mockedPmHostName);
    clientIdMock = sm.mock().returnWith(mockedClientId);
    ipcSendMock = sm.mock(ipcRenderer, "send").returnWith("");
    logInfoMock = sm.mock(log, "info").returnWith();
    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.config.mutations.SET_PM_HOST_NAME = setPmHostNameMock;
    storeConfigCopy.modules.auth.mutations.SET_CLIENT_ID = setClientIdMock;
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(EditServerModal, {
      localVue,
      store,
      computed: {
        pmHostName: pmHostNameMock,
        clientId: clientIdMock
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
    apiUpdateServerDataMock.reset();
    ipcSendMock.reset();
  });

  it("save set defaultPmHostname and defaultClientId if no input", () => {
    wrapper.setData({serverAddress: '', clientIdModel: ''});

    wrapper.vm.save(bvModalEvtMock);

    expect(wrapper.vm.serverAddress).to.be.equal(defaultPmHostName);
    expect(wrapper.vm.clientIdModel).to.be.equal(defaultClientId);
  });

  it("save commit SET_PM_HOST_NAME and SET_CLIENT_ID if host properly formatted", () => {
    wrapper.vm.save(bvModalEvtMock);

    expect(setPmHostNameMock.callCount).to.equal(1);
    expect(setPmHostNameMock.lastCall.args[1]).to.eql(mockedPmHostName);

    expect(bvModalEvtMock.preventDefault.callCount).to.equal(0);

    expect(setClientIdMock.callCount).to.equal(1);
    expect(setClientIdMock.lastCall.args[1]).to.eql(mockedClientId);
  });

  it("save update hostName in api client and localServer", () => {
    wrapper.vm.save(bvModalEvtMock);

    expect(apiUpdateServerDataMock.callCount).to.equal(1);
    expect(apiUpdateServerDataMock.lastCall.args[0]).to.eql(mockedPmHostName, mockedClientId);

    expect(ipcSendMock.callCount).to.equal(1);
    expect(ipcSendMock.lastCall.args).to.eql(['updateHostName', mockedPmHostName]);
  });

  it("save return set error flag if host name NOT properly formatted", () => {
    wrapper.setData({serverAddress: 'boom!'});

    expect(() => wrapper.vm.save(bvModalEvtMock)).to.throw('cantParseHostName');

    expect(setPmHostNameMock.callCount).to.equal(0);
    expect(wrapper.vm.serverAddressError).to.equal(true);
    expect(bvModalEvtMock.preventDefault.callCount).to.equal(1);
  });
});
