/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { createLocalVue, shallowMount } from "@vue/test-utils";
import sm from "simple-mock"

import BootstrapVue from "bootstrap-vue";
import flushPromises from "flush-promises";
import Vuex from "vuex";
import storeConfig from "../../../src/renderer/store";
import cloneDeep from "lodash.clonedeep";


import LoginPage from "../../../src/renderer/components/LoginPage";

import {remote} from "electron";
import {USER_PROPS} from "../../tools/testValues";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

// Mock BootstrapVue prototypes here (eg. localVue.prototype.$bvModal = {msgBoxConfirm: jest.fn()}; )
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.use(Vuex);
localVue.component("font-awesome-icon", ); // avoid font awesome warnings


// Mock prototype and mixin bellow
localVue.prototype.$t = (text, args = "") => {
  return text + args;
}; // i18n mock
localVue.prototype.$tc = (text, args = "") => {
  return text + args;
}; // i18n mock
const openExternalMock = sm.mock();
localVue.prototype.$electron = {
  shell: {openExternal: openExternalMock}
}; // electron prototype mock
let getAccessTokenMock = sm.mock();
let apiMock = {getAccessToken: getAccessTokenMock};
localVue.prototype.$api = apiMock; // api prototype mock
const routerPushMock = sm.mock();
localVue.prototype.$router = { push: routerPushMock }; // router mock

// Global mocks
const skipLoginIfAuthenticatedMock = sm.mock();

// Api response mock
const mockedGetAccessTokenResponse = {
  data : {
    access: 'fakeAccess',
    refresh: 'fakeRefresh'
  }
};

describe("LoginPage template", () => {
  // define all var needed for the test here
  let wrapper;
  let storeConfigCopy;
  let store;
  let mockedApiHostName;
  let apiHostNameMock;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    mockedApiHostName = "https://example.com";
    storeConfigCopy = cloneDeep(storeConfig);
    apiHostNameMock = sm.mock().returnWith("https://example.com");
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(LoginPage, {
      localVue,
      store,
      computed: {
        apiHostName: apiHostNameMock
      }
    });
  });

  afterEach(() => {
    sm.restore();
  });

  it("renders properly html element", () => {
    const elementSelector = "#login-form";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });

  it("renders properly component data", async () => {
    expect(wrapper.text()).to.contains(mockedApiHostName);
  });
});

describe("LoginPage mounted", () => {
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
    wrapper = shallowMount(LoginPage, {
      localVue,
      store,
      methods: {
        skipLoginIfAuthenticated: skipLoginIfAuthenticatedMock
      }
    });
  });

  afterEach(() => {
    sm.restore();
    skipLoginIfAuthenticatedMock.reset();
  });

  it("electron remote.setContentSize is called to set window size", () => {
    expect(getCurrentWindowMock.callCount).to.equal(1);
    expect(setContentSizeMock.callCount).to.equal(1);
    expect(setContentSizeMock.lastCall.args[0]).to.equal(fakeWidth); // come from getContentSize return, first item
    expect(setContentSizeMock.lastCall.args[1]).to.equal(wrapper.vm.windowHeight); // come from windowHeight data
  });

  it("skipLoginIfAuthenticated is called", () => {
    expect(skipLoginIfAuthenticatedMock.callCount).to.equal(1);
  });
});

describe("LoginPage methods", () => {
  let wrapper;
  let storeConfigCopy;
  let store;
  let refreshAccessTokenMock;
  let accessTokenMock;
  let saveAuthenticationDataMock;

  beforeEach(() => {
    refreshAccessTokenMock = sm.mock();
    accessTokenMock = sm.mock();
    saveAuthenticationDataMock = sm.mock();
    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.auth.actions.refreshAccessToken = refreshAccessTokenMock;
    storeConfigCopy.modules.auth.mutations.SAVE_AUTHENTICATION_DATA = saveAuthenticationDataMock;
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(LoginPage, {
      localVue,
      store,
      methods: {
        skipLoginIfAuthenticated: skipLoginIfAuthenticatedMock
      },
      computed: {
        accessToken: accessTokenMock
      }
    });
  });

  afterEach(() => {
    sm.restore();
    routerPushMock.reset();
    getAccessTokenMock.reset();
    getAccessTokenMock.actions = []; // to reset rejectWith / resolveWith actions
  });

  it("open call electron openExternal", () => {
    const fakeLink = 'http://example.com';
    wrapper.vm.open(fakeLink);

    expect(openExternalMock.callCount).to.equal(1);
    expect(openExternalMock.lastCall.args[0]).to.equal(fakeLink);
  });

  it("skipLoginIfAuthenticated skip login if not needed", async () => {
    // restore original method to test it
    wrapper.setMethods({ skipLoginIfAuthenticated: LoginPage.methods.skipLoginIfAuthenticated });
    // when accessToken unset
    accessTokenMock.returnWith('');

    wrapper.vm.skipLoginIfAuthenticated();

    // no auto relogin is attempted
    expect(refreshAccessTokenMock.callCount).to.equal(0);
    expect(wrapper.vm.refreshPending).to.equal(false);
  });

  it("skipLoginIfAuthenticated let user login if needed", async () => {
    // restore original method to test it
    wrapper.setMethods({ skipLoginIfAuthenticated: LoginPage.methods.skipLoginIfAuthenticated });
    // when accessToken is already set
    accessTokenMock.returnWith('bingo!');

    wrapper.vm.skipLoginIfAuthenticated();

    // auto relogin is attempted
    expect(refreshAccessTokenMock.callCount).to.equal(1);
    expect(refreshAccessTokenMock.lastCall.args[1]).to.equal(apiMock);
    expect(wrapper.vm.refreshPending).to.equal(true);

    await flushPromises();
    expect(wrapper.vm.refreshPending).to.equal(false);
    expect(routerPushMock.callCount).to.equal(1);
    expect(routerPushMock.lastCall.args[0]).to.eql({name: 'home'});
  });

  it("login call proper api", () => {
    wrapper.setData({email: USER_PROPS.email, password: USER_PROPS.password});

    wrapper.vm.login();

    expect(getAccessTokenMock.callCount).to.equal(1);
    expect(getAccessTokenMock.lastCall.args).to.eql([USER_PROPS.email, USER_PROPS.password]);
  });

  it("login store data in store and redirect to home on success", async () => {
    wrapper.setData({email: USER_PROPS.email, password: USER_PROPS.password});
    getAccessTokenMock.resolveWith(mockedGetAccessTokenResponse);

    wrapper.vm.login();
    await flushPromises();

    expect(saveAuthenticationDataMock.callCount).to.equal(1);
    expect(saveAuthenticationDataMock.lastCall.args[1]).to.eql(
      {
        accountName: USER_PROPS.email,
        accessToken: mockedGetAccessTokenResponse.data.access,
        refreshToken: mockedGetAccessTokenResponse.data.refresh
      }
    );
    expect(routerPushMock.callCount).to.equal(1);
    expect(routerPushMock.lastCall.args[0]).to.eql({name: 'home'});
  });

  it("login handle API error properly", async () => {
    const errorDetail = 'boom!';
    getAccessTokenMock.rejectWith({response: {data: {detail: errorDetail}}});

    wrapper.vm.login();
    await flushPromises();

    expect(wrapper.vm.lastError).to.include(errorDetail);
  });
});
