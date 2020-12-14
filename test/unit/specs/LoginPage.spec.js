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

import {remote, ipcRenderer} from "electron";
import {USER_PROPS} from "../../tools/testValues";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

// Global mocks
const mockedWidth = 100;

let globalMocks = {
  setContentSize : sm.mock(),
  getContentSize : sm.mock().returnWith([mockedWidth, 0]),
  ipcOn : sm.mock(ipcRenderer, "on").returnWith(""),
  ipcSend : sm.mock(ipcRenderer, "send").returnWith(""),
  ipcRemoveAllListeners : sm.mock(ipcRenderer, "removeAllListeners").returnWith(""),
  openExternal: sm.mock()
};
globalMocks.getCurrentWindowMock =sm.mock(remote, "getCurrentWindow").returnWith(
  {setContentSize: globalMocks.setContentSize, getContentSize: globalMocks.getContentSize}
);

function resetGlobalMocks() {
  Object.values(globalMocks).forEach(mock => mock.reset());
}

// Mock prototype and mixin bellow
localVue.prototype.$t = (text, args = "") => {
  return text + args;
}; // i18n mock
localVue.prototype.$tc = (text, args = "") => {
  return text + args;
}; // i18n mock
localVue.prototype.$electron = {
  shell: {openExternal: globalMocks.openExternal}
}; // electron prototype mock

// Api response mock
const mockedGetAccessTokenResponse = {
  data : {
    access_token: 'fakeAccessToken',
    expires_in: 'fakeExpiresIn',
    refresh_token: 'fakeRefreshToken'
  }
};
let getAccessTokenMock = sm.mock();
let apiMock = {getAccessToken: getAccessTokenMock};
localVue.prototype.$api = apiMock; // api prototype mock

const routerPushMock = sm.mock();
localVue.prototype.$router = { push: routerPushMock }; // router mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

const mockedPmHostName = "https://example.com";
const mockedClientId = "https://example.com";
const mockedRedirectUri = "https://example.com/2";

describe("LoginPage template", () => {
  // define all var needed for the test here
  let wrapper;
  let storeConfigCopy;
  let store;
  let pmHostNameMock;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    storeConfigCopy = cloneDeep(storeConfig);
    pmHostNameMock = sm.mock().returnWith(mockedPmHostName);
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(LoginPage, {
      localVue,
      store,
      computed: {
        pmHostName: pmHostNameMock
      }
    });
  });

  afterEach(() => {
    resetGlobalMocks();
  });

  it("renders properly html element", () => {
    const elementSelector = "#login-page";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });

  it("renders properly component data", async () => {
    expect(wrapper.text()).to.contains(mockedPmHostName);
  });
});

describe("LoginPage mounted", () => {
  let wrapper;
  let store;
  let storeConfigCopy;
  let disconnectUserMock;
  let pmHostNameMock;
  let getAndStoreAccessTokenMock;

  beforeEach(() => {
    globalMocks.ipcSend.reset(); // reset call made by electron
    disconnectUserMock = sm.mock().resolveWith();
    pmHostNameMock = sm.mock().returnWith(mockedPmHostName);
    getAndStoreAccessTokenMock = sm.mock().returnWith("");

    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.auth.actions.disconnectUser = disconnectUserMock;
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(LoginPage, {
      localVue,
      store,
      computed: {
        pmHostName: pmHostNameMock
      },
      methods: {
        getAndStoreAccessToken: getAndStoreAccessTokenMock
      }
    });
  });

  afterEach(() => {
    resetGlobalMocks();
  });

  it("electron remote.setContentSize is called to set window size", () => {
    expect(globalMocks.getCurrentWindowMock.callCount).to.equal(1);
    expect(globalMocks.setContentSize.callCount).to.equal(1);
    expect(globalMocks.setContentSize.lastCall.args[0]).to.equal(mockedWidth); // come from getContentSize return, first item
    expect(globalMocks.setContentSize.lastCall.args[1]).to.equal(wrapper.vm.windowHeight); // come from windowHeight data
  });

  it("disconnectUser is called", () => {
    expect(disconnectUserMock.callCount).to.equal(1);
    expect(disconnectUserMock.lastCall.args[1]).to.eql({
      apiClient: wrapper.vm.$api,
      reason: 'auto disconnect at startup'
    });
  });

  it("listen to and emmit Oauth2 events", () => {
    expect(globalMocks.ipcOn.callCount).to.equal(2);
    expect(globalMocks.ipcSend.callCount).to.equal(1);
    expect(globalMocks.ipcOn.calls[0].args[0]).to.equal("oauthFlowSuccess");
    // event callback is properly defined
    const oauthFlowSuccessCallBack = globalMocks.ipcOn.calls[0].args[1];
    oauthFlowSuccessCallBack('fakeEvent', 'fakeCode');
    expect(getAndStoreAccessTokenMock.callCount).to.equal(1);
    expect(getAndStoreAccessTokenMock.lastCall.arg).to.equal('fakeCode');
    expect(globalMocks.ipcOn.calls[1].args[0]).to.equal("oauthFlowError");
    // event callback is properly defined
    const oauthFlowErrorCallBack = globalMocks.ipcOn.calls[1].args[1];
    oauthFlowErrorCallBack('fakeEvent', 'fakeError');
    expect(wrapper.vm.lastErrorCode).to.equal('fakeError');

    expect(globalMocks.ipcSend.lastCall.args).to.eql(["startLocalServer", mockedPmHostName]);
  });
});

describe("LoginPage destroyed", () => {
  let wrapper;
  let store;
  let storeConfigCopy;
  let disconnectUserMock;
  let pmHostNameMock;

  beforeEach(() => {
    globalMocks.ipcSend.reset(); // reset call made by electron
    disconnectUserMock = sm.mock().resolveWith();
    pmHostNameMock = sm.mock().returnWith(mockedPmHostName);

    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.auth.actions.disconnectUser = disconnectUserMock;
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(LoginPage, {
      localVue,
      store,
      computed: {
        pmHostName: pmHostNameMock
      },
    });
  });

  afterEach(() => {
    resetGlobalMocks();
  });

  it("Oauth2 events listener are properly removed, shutdownLocalServer event is sent", () => {
    globalMocks.ipcSend.reset(); // reset call made by mounted

    wrapper.destroy();

    expect(globalMocks.ipcRemoveAllListeners.callCount).to.equal(2);
    expect(globalMocks.ipcRemoveAllListeners.calls[0].arg).to.equal("oauthFlowSuccess");
    expect(globalMocks.ipcRemoveAllListeners.calls[1].arg).to.equal("oauthFlowError");
    expect(globalMocks.ipcSend.callCount).to.equal(1);
    expect(globalMocks.ipcSend.lastCall.arg).to.equal("shutdownLocalServer");
  });
});

describe("LoginPage methods", () => {
  let wrapper;
  let store;
  let storeConfigCopy;
  let disconnectUserMock;
  let pmHostNameMock;
  let openMock;
  let clientIdMock;
  let redirectUriMock;
  let saveAuthenticationDataMock;

  beforeEach(() => {
    globalMocks.ipcSend.reset(); // reset call made by electron
    disconnectUserMock = sm.mock().resolveWith();
    pmHostNameMock = sm.mock().returnWith(mockedPmHostName);
    clientIdMock = sm.mock().returnWith(mockedClientId);
    redirectUriMock = sm.mock().returnWith(mockedRedirectUri);
    pmHostNameMock = sm.mock().returnWith(mockedPmHostName);
    openMock = sm.mock().returnWith();
    saveAuthenticationDataMock = sm.mock();

    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.auth.actions.disconnectUser = disconnectUserMock;
    storeConfigCopy.modules.auth.mutations.SAVE_AUTHENTICATION_DATA = saveAuthenticationDataMock;
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(LoginPage, {
      localVue,
      store,
      computed: {
        pmHostName: pmHostNameMock,
        clientId: clientIdMock,
        redirectUri: redirectUriMock
      },
      methods: {
        open: openMock
      }
    });
  });

  afterEach(() => {
    resetGlobalMocks();
    openMock.reset();
    routerPushMock.reset();
    getAccessTokenMock.reset();
    getAccessTokenMock.actions = [];
  });

  it("open call electron openExternal", () => {
    // restore original method to test it
    wrapper.setMethods({ open: LoginPage.methods.open });
    const mockedLink = 'http://example.com';
    wrapper.vm.open(mockedLink);

    expect(globalMocks.openExternal.callCount).to.equal(1);
    expect(globalMocks.openExternal.lastCall.args[0]).to.equal(mockedLink);
  });

  it("openLoginPage reset lastErrorCode and and call open", () => {
    // given
    wrapper.setData({lastErrorCode: 'randomError'});

    // when
    wrapper.vm.openLoginPage();

    // then
    expect(wrapper.vm.lastErrorCode).to.equal('');
    expect(openMock.callCount).to.equal(1);
    expect(openMock.lastCall.arg).to.equal(
      `${mockedPmHostName}/oauth2/authorize/?response_type=code&client_id=${mockedClientId}` +
      `&redirect_uri=${mockedRedirectUri}&scope=read write&approval_prompt=auto`
    );
  });

  it("getAndStoreAccessToken call proper api", async () => {
    getAccessTokenMock.resolveWith(mockedGetAccessTokenResponse);

    // when
    const mockedAuthCode = 'fakeAuthCode';
    await wrapper.vm.getAndStoreAccessToken(mockedAuthCode);

    // then
    expect(getAccessTokenMock.callCount).to.equal(1);
    expect(getAccessTokenMock.lastCall.arg).to.equal(mockedAuthCode);
  });

  it("getAndStoreAccessToken store data in store and redirect to home on success", async () => {
    // given
    getAccessTokenMock.resolveWith(mockedGetAccessTokenResponse);

    // when
    wrapper.vm.getAndStoreAccessToken();
    await flushPromises();

    // then
    expect(saveAuthenticationDataMock.callCount).to.equal(1);
    expect(saveAuthenticationDataMock.lastCall.args[1]).to.eql(
      {
        accessToken: mockedGetAccessTokenResponse.data.access_token,
        accessTokenExpiresIn: mockedGetAccessTokenResponse.data.expires_in,
        refreshToken: mockedGetAccessTokenResponse.data.refresh_token
      }
    );
    expect(routerPushMock.callCount).to.equal(1);
    expect(routerPushMock.lastCall.args[0]).to.eql({name: 'home'});
  });

  it("getAndStoreAccessToken handle error", async () => {
    // given
    getAccessTokenMock.rejectWith("boom!");
    wrapper.setData({lastErrorCode: ''});

    // when
    wrapper.vm.getAndStoreAccessToken();
    await flushPromises();

    // then
    expect(wrapper.vm.lastErrorCode).to.equal("cantGetAccessToken");
  });
});
