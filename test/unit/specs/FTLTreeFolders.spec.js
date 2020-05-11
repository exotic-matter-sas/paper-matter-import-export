/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { createLocalVue, shallowMount } from "@vue/test-utils";
import sm from "simple-mock"

import BootstrapVue from "bootstrap-vue";
import Vuex from "vuex";

import * as tv from "../../tools/testValues.js";
import FTLTreeFolders from "../../../src/renderer/components/HomePage/FolderPickerModal/FTLTreeFolders";
import flushPromises from "flush-promises";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

let listFoldersMock = sm.mock();
let apiMock = {listFolders: listFoldersMock};
localVue.prototype.$api = apiMock; // api prototype mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

describe("FTLTreeFolders template", () => {
  // define all var needed for the test here
  let wrapper;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    listFoldersMock.resolveWith({
      data: [tv.FOLDER_TREE_ITEM, tv.FOLDER_TREE_ITEM_WITH_DESCENDANT]
    });
    wrapper = shallowMount(FTLTreeFolders, {
      localVue,
      propsData: {
        unSavedImportDestination: {},
        store: {
          state: {
            auth: {
              accessToken: 'fakeAccessToken'
            }
          }
        },
        i18n: {
          t: sm.mock().returnWith('')
        }
      }
    });
  });

  afterEach(() => {
    sm.restore();
    listFoldersMock.reset();
  });

  it("renders properly html element", () => {
    const elementSelector = "#moving-folders";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });
});

describe("FTLTreeFolders mounted", () => {
  // define all var needed for the test here
  let wrapper;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    listFoldersMock.resolveWith({
      data: [tv.FOLDER_TREE_ITEM, tv.FOLDER_TREE_ITEM_WITH_DESCENDANT]
    });
    wrapper = shallowMount(FTLTreeFolders, {
      localVue,
      propsData: {
        unSavedImportDestination: {},
        store: {
          state: {
            auth: {
              accessToken: 'fakeAccessToken'
            }
          }
        },
        i18n: {
          t: sm.mock().returnWith('')
        }
      }
    });
  });

  afterEach(() => {
    sm.restore();
    listFoldersMock.reset();
    listFoldersMock.actions = [];
  });

  it("listFolders is called", () => {
    expect(listFoldersMock.callCount).to.equal(1);
    expect(listFoldersMock.lastCall.arg).to.equal('fakeAccessToken');
  });

  it("handle properly listFolders success", async () => {
    await flushPromises();

    expect(wrapper.vm.lastFolderListingFailed).to.equal(false);
    // folders data is properly populated with root folder and listFolders response
    expect(wrapper.vm.folders).to.eql([
      {
        id: null,
        name: '',
        has_descendant: true,
        is_root: true,
        children: [
          {
            id: tv.FOLDER_TREE_ITEM.id,
            name: tv.FOLDER_TREE_ITEM.name,
            has_descendant: tv.FOLDER_TREE_ITEM.has_descendant,
            children: []
          },
          {
            id: tv.FOLDER_TREE_ITEM_WITH_DESCENDANT.id,
            name: tv.FOLDER_TREE_ITEM_WITH_DESCENDANT.name,
            has_descendant: tv.FOLDER_TREE_ITEM_WITH_DESCENDANT.has_descendant,
            children: []
          },
        ]
      },
    ]);
  });

  it("handle properly listFolders error", async () => {
    // redefine wrapper here for listFoldersMock to reject before mounted called
    listFoldersMock.rejectWith('Boom!');
    wrapper = shallowMount(FTLTreeFolders, {
      localVue,
      propsData: {
        unSavedImportDestination: {},
        store: {
          state: {
            auth: {
              accessToken: 'fakeAccessToken'
            }
          }
        },
        i18n: {
          t: sm.mock().returnWith('')
        }
      }
    });

    await flushPromises();

    expect(wrapper.vm.lastFolderListingFailed).to.equal(true);
  });
});
