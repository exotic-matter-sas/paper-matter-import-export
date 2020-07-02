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

import EditServerAddressModal from "../../../src/renderer/components/LoginPage/EditServerAddressModal";
import {defaultApiHostName} from "../../../src/renderer/store/modules/config";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

// Mock prototype and mixin bellow
localVue.prototype.$t = (text, args = "") => {
  return text + args;
}; // i18n mock
localVue.prototype.$tc = (text, args = "") => {
  return text + args;
}; // i18n mock
let apiConstructorMock = sm.mock();
let getAccessTokenMock = sm.mock();
let apiMock = {constructor: apiConstructorMock, getAccessToken: getAccessTokenMock};
localVue.prototype.$api = apiMock; // api prototype mock
const routerPushMock = sm.mock();
localVue.prototype.$router = { push: routerPushMock }; // router mock
const showModalMock = sm.mock();
localVue.prototype.$bvModal = { show: showModalMock }; // bvModal mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings


describe("EditServerAddressModal template", () => {
  // define all var needed for the test here
  let wrapper;
  let storeConfigCopy;
  let store;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(EditServerAddressModal, {
      localVue,
      store
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("renders properly html element", () => {
    const elementSelector = "#edit-server-address-modal";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });
});

describe("EditServerAddressModal mounted", () => {
  let wrapper;
  let store;
  let storeConfigCopy;
  let fakeWidth;
  let mockedApiHostName;
  let apiHostNameMock;

  beforeEach(() => {
    fakeWidth = 100;
    mockedApiHostName = "https://example.com";
    apiHostNameMock = sm.mock().returnWith("https://example.com");
    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(EditServerAddressModal, {
      localVue,
      store,
      computed: {
        apiHostName: apiHostNameMock
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
  });

  it("modal is shown and proper values are set", () => {
    expect(showModalMock.callCount).to.equal(1);
    expect(showModalMock.lastCall.args[0]).to.equal('edit-server-address-modal');
    expect(wrapper.vm.serverAddress).to.equal(mockedApiHostName);
    expect(wrapper.vm.inputPlaceholder).to.equal(defaultApiHostName);
  });
});

describe("EditServerAddressModal methods", () => {
  let wrapper;
  let storeConfigCopy;
  let store;
  let bvModalEvtMock;
  let setApiHostNameMock;
  let mockedApiHostName;
  let apiHostNameMock;

  beforeEach(() => {
    bvModalEvtMock = {preventDefault: sm.mock()};
    setApiHostNameMock = sm.mock();
    mockedApiHostName = "https://example.com";
    apiHostNameMock = sm.mock().returnWith("https://example.com");
    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.config.mutations.SET_API_HOST_NAME = setApiHostNameMock;
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(EditServerAddressModal, {
      localVue,
      store,
      computed: {
        apiHostName: apiHostNameMock
      }
    });
  });

  afterEach(() => {
    sm.restore();
    showModalMock.reset();
    apiConstructorMock.reset();
  });

  it("save set defaultApiHostname if no serverAddress has been input", () => {
    wrapper.setData({serverAddress: ''});

    wrapper.vm.save(bvModalEvtMock);

    expect(wrapper.vm.serverAddress).to.be.equal(defaultApiHostName);
  });

  it("save commit SET_API_HOST_NAME if host name properly formatted", () => {
    wrapper.vm.save(bvModalEvtMock);

    expect(setApiHostNameMock.callCount).to.equal(1);
    expect(setApiHostNameMock.lastCall.args[0]).to.eql(
      {apiHostName: 'https://papermatter.app'});
    expect(bvModalEvtMock.preventDefault.callCount).to.equal(0);
  });

  it("save re-instantiate api with api hostName", () => {
    wrapper.vm.save(bvModalEvtMock);

    expect(apiConstructorMock.callCount).to.equal(1);
    expect(apiConstructorMock.lastCall.args[0]).to.eql(mockedApiHostName);
  });

  it("save return set error flag if host name NOT properly formatted", () => {
    wrapper.setData({serverAddress: 'Oops'});

    wrapper.vm.save(bvModalEvtMock);

    expect(setApiHostNameMock.callCount).to.equal(0);
    expect(wrapper.vm.updateError).to.equal(true);
    expect(bvModalEvtMock.preventDefault.callCount).to.equal(1);
  });
});
