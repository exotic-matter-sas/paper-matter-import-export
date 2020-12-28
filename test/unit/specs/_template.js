/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { createLocalVue, shallowMount } from "@vue/test-utils";
import sm from "simple-mock";

import BootstrapVue from "bootstrap-vue";
import flushPromises from "flush-promises";
import Vuex from "vuex";
import storeConfig from "../../../src/renderer/store";
import cloneDeep from "lodash.clonedeep";

import { remote } from "electron";
import * as tv from "../../tools/testValues.js";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

// TODO Mock used prototype bellow
localVue.prototype.$t = (text, args = "") => {
  return text + args;
}; // i18n mock
localVue.prototype.$tc = (text, args = "") => {
  return text + args;
}; // i18n mock
const openExternalMock = sm.mock();
localVue.prototype.$electron = {
  shell: { openExternal: openExternalMock },
}; // electron prototype mock
let requestAMock = sm.mock();
let apiMock = { requestA: requestAMock };
localVue.prototype.$api = apiMock;
const routerPushMock = sm.mock();
localVue.prototype.$router = { push: routerPushMock }; // router mock

// Attach Vue plugins bellow (after prototype mocks)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

// TODO define Api response mock bellow
const mockedRequestASuccessResponse = {
  data: {
    access: "fakeAccess",
    refresh: "fakeRefresh",
  },
};

const mockedRequestAErrorResponse = {
  response: {
    data: {
      detail: "boom!",
    },
  },
};

describe("Component template", () => {
  // define all vars common to the describe block here
  let wrapper;
  let store;
  let mockedComputeAValue;
  let computedAMock;

  beforeEach(() => {
    // set vars common to the describe block here (vue wrapper args, fake values, mocks)
    mockedComputeAValue = "https://example.com";
    computedAMock = sm.mock().returnWith(mockedComputeAValue);
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(Component, {
      localVue,
      store,
      computed: {
        computedA: {
          cache: false,
          get: computedAMock,
        },
      },
    });
  });

  afterEach(() => {
    sm.restore();
  });

  it("renders properly html element", () => {
    const elementSelector = "#main-element";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });

  it("renders properly component data", () => {
    expect(wrapper.text()).to.contains(mockedComputeAValue);
  });
});

describe("Component mounted", () => {
  // define all vars common to the describe block here
  let wrapper;
  let store;
  let mockedComputeAValue;
  let computedAMock;
  let mockedComputeBValue;
  let computedBMock;
  let methodAMock;
  let methodBMock;
  let libraryMethodMock;

  beforeEach(() => {
    // mock all component computed, methods, library called in mounted
    mockedComputeAValue = "A";
    computedAMock = sm.mock().returnWith(mockedComputeAValue);
    mockedComputeBValue = "B";
    computedBMock = sm.mock().returnWith(mockedComputeBValue);
    methodAMock = sm.mock();
    methodBMock = sm.mock();
    libraryMethodMock = sm.mock(remote.dialog, "showMessageBox").returnWith("");
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(Component, {
      localVue,
      store,
      computed: {
        computedA: {
          cache: false,
          get: computedAMock,
        },
        computedB: {
          cache: false,
          get: computedBMock,
        },
      },
      methods: {
        methodA: methodAMock,
        methodB: methodBMock,
      },
    });
  });

  afterEach(() => {
    sm.restore();
    // to remove value set with returnWith
    methodAMock.actions = [];
    methodBMock.actions = [];
  });

  it("method/library have been called", () => {
    // methodA has been called 1 time
    expect(methodAMock.callCount).to.equal(1);

    // libraryMethod has been called 1 time with mockedComputeAValue as first arg
    expect(libraryMethodMock.callCount).to.equal(1);
    expect(libraryMethodMock.lastCall.args[0]).to.equal(mockedComputeAValue);
  });

  it("test mounted logic/conditions", () => {
    // given computed A is true and computed B is false
    computedAMock.returnWith(true);
    computedBMock.returnWith(false);
    // wrapper have to be define after computed values have been mocked
    wrapper = shallowMount(Component, {
      localVue,
      store,
      computed: {
        computedA: {
          cache: false,
          get: computedAMock,
        },
        computedB: {
          cache: false,
          get: computedBMock,
        },
      },
      methods: {
        methodA: methodAMock,
        methodB: methodBMock,
      },
    });

    // then only method A is called
    expect(methodAMock.callCount).to.equal(1);
    expect(methodBMock.callCount).to.equal(0);
  });
});

describe("Component computed", () => {
  // define all vars common to the describe block here
  let wrapper;
  let store;

  beforeEach(() => {
    // mock all component computed, methods, library called in mounted
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(Component, {
      localVue,
      store,
      propsData: {
        propsA: true,
      },
    });
  });

  afterEach(() => {
    sm.restore();
  });

  it("test computed based on data return proper value", () => {
    // FIXME not tested !!! computed cache may prevent this test to work
    wrapper.setData({ dataA: "A", dataB: "B" });

    expect(wrapper.vm.computedA).to.equal("A+B");
  });
});

describe("Component methods", () => {
  // define all vars common to the describe block here
  let wrapper;
  let store;
  let mockedComputeAValue;
  let computedAMock;
  let mockedComputeBValue;
  let computedBMock;
  let methodAMock;
  let methodBMock;
  let libraryMethodMock;
  let storeConfigCopy;
  let mutationAMock;
  let actionAMock;

  beforeEach(() => {
    // mock all component computed, methods, library called in mounted
    mockedComputeAValue = "A";
    computedAMock = sm.mock().returnWith(mockedComputeAValue);
    mockedComputeBValue = "B";
    computedBMock = sm.mock().returnWith(mockedComputeBValue);
    methodAMock = sm.mock();
    methodBMock = sm.mock();
    libraryMethodMock = sm.mock(remote.dialog, "showMessageBox").returnWith("");

    // Copy store config to mock some mutations and actions
    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.auth.mutations.MUTATION_A = mutationAMock;
    storeConfigCopy.modules.auth.actions.actionA = actionAMock;
    store = new Vuex.Store(storeConfigCopy);

    wrapper = shallowMount(Component, {
      localVue,
      store,
      computed: {
        computedA: {
          cache: false,
          get: computedAMock,
        },
        computedB: {
          cache: false,
          get: computedBMock,
        },
      },
      methods: {
        methodA: methodAMock,
        methodB: methodBMock,
      },
    });
  });

  afterEach(() => {
    sm.restore();
    // to remove call counter
    requestAMock.reset();
    // to reset rejectWith / resolveWith actions
    requestAMock.actions = [];
  });

  it("methodA call methodB", () => {
    // restore original method to test it
    wrapper.setMethods({ methodA: Component.methods.methodA });

    wrapper.vm.methodA();

    expect(methodAMock.callCount).to.equal(1);
  });

  it("test methodA logic/conditions", () => {
    // given computed A is true and dataA empty
    computedAMock.returnWith(true);
    wrapper.setData({ dataA: "" });

    wrapper.vm.methodA();

    // then method A set dataA to true
    expect(wrapper.vm.dataA).to.equal("Im all set");
  });

  it("methodA call api", async () => {
    wrapper.vm.methodA();

    // then request A is called with proper params
    expect(requestAMock.callCount).to.equal(1);
    expect(requestAMock.lastCall.args).to.eql([
      tv.USER_PROPS.email,
      tv.USER_PROPS.password,
    ]);
  });

  it("methodA handle api success", async () => {
    // given api call succeed
    requestAMock.resolveWith(mockedRequestASuccessResponse);

    wrapper.vm.methodA();
    await flushPromises();

    // then user is redirect to home page
    expect(routerPushMock.callCount).to.equal(1);
    expect(routerPushMock.lastCall.args[0]).to.eql({ name: "home" });
  });

  it("methodA handle api error", async () => {
    requestAMock.rejectWith(mockedRequestASuccessResponse);

    wrapper.vm.methodA();
    await flushPromises();

    // then request A is called with proper params
    expect(wrapper.vm.lastError).to.include("boom!");
  });

  it("methodA commit/dispatch data to store", async () => {
    wrapper.vm.methodA();
    await flushPromises();

    // then commitA and actionA are called with proper params
    expect(mutationAMock.callCount).to.equal(1);
    expect(mutationAMock.lastCall.args[1]).to.equal("commitA arg");
    expect(actionAMock.callCount).to.equal(1);
    expect(actionAMock.lastCall.args[1]).to.equal("actionA arg");
  });

  it("methodA emit eventA", async () => {
    const testedEvent = "event-a";

    // when
    wrapper.vm.methodA();
    await flushPromises();

    // then
    expect(wrapper.emitted(testedEvent)).to.not.be.undefined;
    expect(wrapper.emitted(testedEvent).length).to.equal(1);
    expect(wrapper.emitted(testedEvent)[0]).to.be.eql(["eventArg1"]);
  });

  it("watcherA set dataB properly", async () => {
    wrapper.setData({ watcherA: 42 });
    await flushPromises();

    expect(wrapper.vm.dataB).to.be.equal(true);

    wrapper.setData({ watcherA: 43 });
    await flushPromises();

    expect(wrapper.vm.metadataFileDetected).to.be.equal(false);
  });
});
