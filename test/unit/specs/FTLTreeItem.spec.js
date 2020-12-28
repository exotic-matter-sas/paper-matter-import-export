/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { createLocalVue, shallowMount } from "@vue/test-utils";
import sm from "simple-mock";

import BootstrapVue from "bootstrap-vue";
import Vuex from "vuex";

import * as tv from "../../tools/testValues.js";
import flushPromises from "flush-promises";
import FTLTreeItem from "../../../src/renderer/components/HomePage/FolderPickerModal/FTLTreeItem";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

let listFoldersMock = sm.mock();
let apiMock = { listFolders: listFoldersMock };
localVue.prototype.$api = apiMock; // api prototype mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

describe("FTLTreeItem template", () => {
  // define all var needed for the test here
  let wrapper;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    listFoldersMock.resolveWith({
      response: {
        data: [tv.FOLDER_TREE_ITEM, tv.FOLDER_TREE_ITEM_WITH_DESCENDANT],
      },
    });
    wrapper = shallowMount(FTLTreeItem, {
      localVue,
      propsData: {
        unsavedDestination: {},
        item: {
          id: tv.FOLDER_TREE_ITEM.id,
          name: tv.FOLDER_TREE_ITEM.name,
          has_descendant: tv.FOLDER_TREE_ITEM.has_descendant,
        },
        store: {
          state: {
            auth: {
              accessToken: "fakeAccessToken",
            },
          },
        },
        i18n: {
          t: sm.mock().returnWith(""),
        },
      },
    });
  });

  afterEach(() => {
    sm.restore();
    listFoldersMock.reset();
    listFoldersMock.actions = [];
  });

  it("renders properly html element", () => {
    const elementSelector = ".folder-tree-item";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });

  it("renders properly component data", () => {
    expect(wrapper.text()).to.contains(tv.FOLDER_TREE_ITEM.name);
  });
});

describe("FTLTreeItem methods", () => {
  // define all var needed for the test here
  let wrapper;
  let listItemChildrenMock;
  let mockedItem;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    listFoldersMock.resolveWith({
      data: [tv.FOLDER_TREE_ITEM, tv.FOLDER_TREE_ITEM_WITH_DESCENDANT],
    });
    listItemChildrenMock = sm.mock();
    mockedItem = {
      id: tv.FOLDER_TREE_ITEM.id,
      name: tv.FOLDER_TREE_ITEM.name,
      has_descendant: tv.FOLDER_TREE_ITEM.has_descendant,
    };

    wrapper = shallowMount(FTLTreeItem, {
      localVue,
      propsData: {
        unsavedDestination: {},
        item: mockedItem,
        store: {
          state: {
            auth: {
              accessToken: "fakeAccessToken",
            },
          },
        },
        i18n: {
          t: sm.mock().returnWith(""),
        },
      },
      methods: {
        listItemChildren: listItemChildrenMock,
      },
    });
  });

  afterEach(() => {
    sm.restore();
    listFoldersMock.reset();
  });

  it("toggle call listItemChildren properly", () => {
    // given item: has descendent + is not root + not loading but IS ALREADY open
    wrapper.setData({
      item: {
        has_descendant: true,
        is_root: false,
      },
      isOpen: true,
      loading: false,
    });

    // when
    wrapper.vm.toggle();

    // then listItemChildrenMock is not call
    expect(listItemChildrenMock.callCount).to.be.equal(0);
    // item children are reset
    expect(wrapper.vm.item.children).to.be.eql([]);

    // given item: has descendent + is not root + not open but IS loading
    wrapper.setData({
      item: {
        has_descendant: true,
        is_root: false,
      },
      isOpen: false,
      loading: true,
    });

    // when
    wrapper.vm.toggle();

    // given item: is not root + not loading + not open but HAS NO descendent
    wrapper.setData({
      item: {
        has_descendant: false,
        is_root: false,
      },
      isOpen: false,
      loading: false,
    });

    // given item: has descendent + is not loading + not open but IS root
    wrapper.setData({
      item: {
        has_descendant: false,
        is_root: false,
      },
      isOpen: false,
      loading: false,
    });

    // when
    wrapper.vm.toggle();

    // then listItemChildrenMock is not call
    expect(listItemChildrenMock.callCount).to.be.equal(0);

    // given item: has descendent + is not root + not loading + not open
    wrapper.setData({
      item: {
        has_descendant: true,
        is_root: false,
      },
      isOpen: false,
      loading: false,
      lastFolderListingFailed: true,
    });

    // when
    wrapper.vm.toggle();

    // then listItemChildrenMock is called
    expect(listItemChildrenMock.callCount).to.be.equal(1);
    expect(listItemChildrenMock.lastCall.arg).to.be.equal(
      tv.FOLDER_TREE_ITEM.id
    );
    expect(wrapper.vm.isOpen).to.be.equal(true);
    // some flag are reset
    expect(wrapper.vm.lastFolderListingFailed).to.be.equal(false);
  });

  it("folderSelected emit event-folder-selected", () => {
    const testedEvent = "event-folder-selected";

    // when
    wrapper.vm.folderSelected();

    // then listItemChildrenMock is called
    expect(wrapper.emitted(testedEvent)).to.not.be.undefined;
    expect(wrapper.emitted(testedEvent).length).to.equal(1);
    expect(wrapper.emitted(testedEvent)[0]).to.be.eql([mockedItem]);
  });

  it("listItemChildren call listFolders api", () => {
    // restore original method to test it
    wrapper.setMethods({
      listItemChildren: FTLTreeItem.methods.listItemChildren,
    });
    const fakeLevel = "fakeLevel";

    // when
    wrapper.vm.listItemChildren(fakeLevel);

    expect(listFoldersMock.callCount).to.equal(1);
    expect(listFoldersMock.lastCall.arg).to.equal("fakeAccessToken", fakeLevel);
  });

  it("listItemChildren handle properly listFolders success", async () => {
    // restore original method to test it
    wrapper.setMethods({
      listItemChildren: FTLTreeItem.methods.listItemChildren,
    });
    wrapper.setData({
      lastFolderListingFailed: true,
      loading: false,
    });

    // when
    wrapper.vm.listItemChildren();
    await flushPromises();

    // then
    expect(wrapper.vm.lastFolderListingFailed).to.equal(false);
    // folders data is properly populated with root folder and listFolders response
    expect(wrapper.vm.item.children).to.eql([
      {
        id: tv.FOLDER_TREE_ITEM.id,
        name: tv.FOLDER_TREE_ITEM.name,
        has_descendant: tv.FOLDER_TREE_ITEM.has_descendant,
        children: [],
      },
      {
        id: tv.FOLDER_TREE_ITEM_WITH_DESCENDANT.id,
        name: tv.FOLDER_TREE_ITEM_WITH_DESCENDANT.name,
        has_descendant: tv.FOLDER_TREE_ITEM_WITH_DESCENDANT.has_descendant,
        children: [],
      },
    ]);
  });

  it("listItemChildren handle properly listFolders error", async () => {
    // redefine wrapper here for listFoldersMock to reject before mounted called
    listFoldersMock.actions = [];
    listFoldersMock.rejectWith("Boom!");
    wrapper = shallowMount(FTLTreeItem, {
      localVue,
      propsData: {
        item: mockedItem,
        unsavedDestination: {},
        store: {
          state: {
            auth: {
              accessToken: "fakeAccessToken",
            },
          },
        },
        i18n: {
          t: sm.mock().returnWith(""),
        },
      },
    });

    // when
    wrapper.vm.listItemChildren();
    await flushPromises();

    expect(wrapper.vm.lastFolderListingFailed).to.equal(true);
  });
});
