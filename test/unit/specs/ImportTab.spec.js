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
import fs from "fs";
import * as tv from "../../tools/testValues.js";
import ImportTab from "../../../src/renderer/components/HomePage/ImportTab";
import { thumbnailGenerator } from "../../../src/renderer/thumbnailGenerator";
import { reportTools } from "../../../src/renderer/htmlReport";

// Create clean Vue instance and set installed package to avoid warning
const localVue = createLocalVue();

// Mock prototype and mixin bellow
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
let getAccessTokenMock = sm.mock();
let uploadDocumentMock = sm.mock().resolveWith({});
let createFolderMock = sm.mock();
let listFoldersMock = sm.mock();
let apiMock = {
  getAccessToken: getAccessTokenMock,
  uploadDocument: uploadDocumentMock,
  createFolder: createFolderMock,
  listFolders: listFoldersMock,
};
localVue.prototype.$api = apiMock; // api prototype mock
const routerPushMock = sm.mock();
localVue.prototype.$router = { push: routerPushMock }; // router mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

// Global mocks
const skipLoginIfAuthenticatedMock = sm.mock();

// Api response mock
const mocked = {
  data: {
    access: "fakeAccess",
    refresh: "fakeRefresh",
  },
};

describe("ImportTab template", () => {
  // define all var needed for the test here
  let wrapper;
  let storeConfigCopy;
  let store;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(ImportTab, {
      localVue,
      store,
      propsData: {
        actionInterrupted: false,
        performRetry: false,
      },
    });
  });

  afterEach(() => {
    sm.restore();
  });

  it("renders properly html element", () => {
    const elementSelector = "#import-tab-content";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });
});

describe("ImportTab watchers", () => {
  // define all var needed for the test here
  let wrapper;
  let storeConfigCopy;
  let store;
  let proceedToImportMock;
  let actionDisabledMock;

  beforeEach(() => {
    proceedToImportMock = sm.mock();
    actionDisabledMock = sm.mock();
    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    wrapper = shallowMount(ImportTab, {
      localVue,
      store,
      propsData: {
        actionInterrupted: false,
        performRetry: false,
      },
      methods: {
        proceedToImport: proceedToImportMock,
      },
      computed: {
        actionDisabled: {
          cache: false,
          get: actionDisabledMock,
        },
      },
    });
  });

  afterEach(() => {
    sm.restore();
  });

  it("filesInsideFolder set detectedMetadataFile properly", async () => {
    wrapper.setData({ filesInsideFolder: [{ name: "import.csv" }] });
    await flushPromises();

    expect(wrapper.vm.detectedMetadataFile).to.be.eql({ name: "import.csv" });

    wrapper.setData({ filesInsideFolder: [{ name: "random.csv" }] });
    await flushPromises();

    expect(wrapper.vm.detectedMetadataFile).to.be.equal(null);
  });

  it("performRetry call proceedToImport if actionDisabled is false", async () => {
    actionDisabledMock.actions = [];
    actionDisabledMock.returnWith(false);

    wrapper.setData({ performRetry: true });
    await flushPromises();

    expect(proceedToImportMock.callCount).to.equal(1);
  });

  it("performRetry doesn't call proceedToImport if actionDisabled is true", async () => {
    actionDisabledMock.actions = [];
    actionDisabledMock.returnWith(true);

    wrapper.setData({ performRetry: true });
    await flushPromises();

    expect(proceedToImportMock.callCount).to.equal(0);
  });

  it("performRetry emit update:performRetry", async () => {
    const testedEvent = "update:performRetry";
    wrapper.setData({ performRetry: true });
    await flushPromises();

    expect(wrapper.emitted(testedEvent)).to.not.be.undefined;
    expect(wrapper.emitted(testedEvent).length).to.equal(1);
    expect(wrapper.emitted(testedEvent)[0]).to.be.eql([false]);
  });
});

describe("ImportTab computed", () => {
  // define all var needed for the test here
  let wrapper;
  let storeConfigCopy;
  let store;
  let savedImportDestinationMock;
  let docsToImportMock;
  let showMessageBoxMock;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
    savedImportDestinationMock = sm.mock();
    docsToImportMock = sm.mock();
    showMessageBoxMock = sm
      .mock(remote.dialog, "showMessageBox")
      .returnWith("");
  });

  afterEach(() => {
    sm.restore();
    savedImportDestinationMock.actions = [];
  });

  it("folderDestinationName return proper value when folder is Root", () => {
    savedImportDestinationMock.returnWith({ name: "Root", id: null });
    // mock returnWith isn't working if done after shallowMount, due to Vue computed cache perhaps?
    wrapper = shallowMount(ImportTab, {
      localVue,
      store,
      propsData: {
        actionInterrupted: false,
        performRetry: false,
      },
      computed: {
        folderDestinationName: ImportTab.computed.folderDestinationName,
        savedImportDestination: savedImportDestinationMock,
      },
    });

    let testedValue = wrapper.vm.folderDestinationName;

    expect(testedValue).to.be.equal("rootFolderName");
  });

  it("folderDestinationName return proper value when folder is NOT Root", () => {
    const fakeFolderName = "FakeFolder";
    savedImportDestinationMock.returnWith({ name: fakeFolderName, id: null });
    // mock returnWith isn't working if done after shallowMount, due to Vue computed cache perhaps?
    wrapper = shallowMount(ImportTab, {
      localVue,
      store,
      propsData: {
        actionInterrupted: false,
        performRetry: false,
      },
      computed: {
        filesInputPlaceholder: ImportTab.computed.filesInputPlaceholder,
        savedImportDestination: savedImportDestinationMock,
      },
    });

    let testedValue = wrapper.vm.folderDestinationName;

    expect(testedValue).to.be.equal(fakeFolderName);
  });

  it("filesInputPlaceholder return proper value when docsToImport empty", async () => {
    docsToImportMock.returnWith([]);
    // mock returnWith isn't working if done after shallowMount, due to Vue computed cache perhaps?
    wrapper = shallowMount(ImportTab, {
      localVue,
      store,
      propsData: {
        actionInterrupted: false,
        performRetry: false,
      },
      computed: {
        filesInputPlaceholder: ImportTab.computed.filesInputPlaceholder,
        docsToImport: docsToImportMock,
      },
    });

    let testedValue = wrapper.vm.filesInputPlaceholder;

    expect(testedValue).to.be.equal("importTab.filesInputPlaceholder");
  });

  it("filesInputPlaceholder return proper value when docsToImport NOT empty", async () => {
    docsToImportMock.returnWith([tv.FILES_PROPS, tv.FILES_PROPS_2]);
    // mock returnWith isn't working if done after shallowMount, due to Vue computed cache perhaps?
    wrapper = shallowMount(ImportTab, {
      localVue,
      store,
      propsData: {
        actionInterrupted: false,
        performRetry: false,
      },
      computed: {
        filesInputPlaceholder: ImportTab.computed.filesInputPlaceholder,
        docsToImport: docsToImportMock,
      },
    });

    let testedValue = wrapper.vm.filesInputPlaceholder;

    expect(testedValue).to.be.equal(
      `${tv.FILES_PROPS.name}, ${tv.FILES_PROPS_2.name}`
    );
  });

  it("actionDisabled return proper value", async () => {
    docsToImportMock.returnWith([]);
    wrapper = shallowMount(ImportTab, {
      localVue,
      store,
      propsData: {
        actionInterrupted: false,
        performRetry: false,
      },
      computed: {
        filesInputPlaceholder: ImportTab.computed.filesInputPlaceholder,
        docsToImport: {
          cache: false,
          get: docsToImportMock,
        },
      },
    });
    // actionDisabled is true by default
    wrapper.setData({ files: [], filesInsideFolder: [] });

    let testedValue = wrapper.vm.actionDisabled;

    expect(testedValue).to.be.equal(true);

    // if a file is selected actionDisabled is false
    wrapper.setData({
      files: [tv.FILES_PROPS],
      filesInsideFolder: [],
      importing: false,
    });

    testedValue = wrapper.vm.actionDisabled;

    expect(testedValue).to.be.equal(false);

    // if a file inside a folder is selected actionDisabled is false
    wrapper.setData({
      files: [],
      filesInsideFolder: [tv.FILES_PROPS],
      importing: false,
    });

    testedValue = wrapper.vm.actionDisabled;

    expect(testedValue).to.be.equal(false);

    // if a import is ongoing actionDisabled is true
    wrapper.setData({
      files: [tv.FILES_PROPS],
      filesInsideFolder: [tv.FILES_PROPS],
      importing: true,
    });

    testedValue = wrapper.vm.actionDisabled;

    expect(testedValue).to.be.equal(true);

    // if there is docsToImport from a previous session actionDisabled is false
    docsToImportMock.actions = [];
    docsToImportMock.returnWith([tv.DOCUMENT_PROPS]);
    wrapper.setData({ files: [], filesInsideFolder: [], importing: false });

    testedValue = wrapper.vm.actionDisabled;

    expect(testedValue).to.be.equal(false);
  });
});

describe("ImportTab methods", () => {
  // define all var needed for the test here
  let wrapper;
  let storeConfigCopy;
  let store;
  let setDocsToImportMock;
  let hashFileMock;
  let docsToImportMock;
  let docsMetadataToImport;
  let importDocsInErrorMock;
  let accessTokenMock;
  let folderDestinationNameMock;
  let mockedSavedImportDestinationValue;
  let savedImportDestinationMock;
  let proceedToImportMock;
  let resetDataImportStartMock;
  let resetDataImportEndMock;
  let createFolderPathMock;
  let showMessageBoxMock;
  let getFileAndMd5FromSerializedDocumentMock;
  let getOrCreateDocumentFolderMock;
  let moveFirstDocFromImportToErrorMock;
  let constructJsonDataMock;
  let createThumbFromFileMock;
  let consumeFirstDocToImportMock;
  let notifyImportEndMock;
  let getFolderIdMock;
  let displayImportErrorPromptMock;
  let displayImportErrorReportMock;
  let moveDocsFromErrorToImportMock;
  let hashStringMock;
  let readFileSyncMock;
  let htmlReportConstructorMock;
  let htmlReportSaveMock;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    docsToImportMock = sm.mock().returnWith([]);
    docsMetadataToImport = sm.mock().returnWith({});
    importDocsInErrorMock = sm.mock().returnWith([]);
    mockedSavedImportDestinationValue = {
      id: 1,
      name: "fakeImportDestination",
    };
    savedImportDestinationMock = sm
      .mock()
      .returnWith(mockedSavedImportDestinationValue);
    accessTokenMock = sm.mock().returnWith("fakeAccessToken");
    folderDestinationNameMock = sm.mock().returnWith("fakeDestination");
    setDocsToImportMock = sm.mock();
    moveFirstDocFromImportToErrorMock = sm.mock();
    hashFileMock = sm.mock();
    hashStringMock = sm.mock();
    proceedToImportMock = sm.mock();
    resetDataImportStartMock = sm.mock();
    resetDataImportEndMock = sm.mock();
    getOrCreateDocumentFolderMock = sm.mock().resolveWith("fakeFolderId");
    createFolderPathMock = sm
      .mock()
      .returnWith(Promise.resolve("fakeFolderId"));
    getFileAndMd5FromSerializedDocumentMock = sm.mock().resolveWith({
      file: tv.FILES_PROPS,
      md5: "fakeMd5",
    });
    constructJsonDataMock = sm.mock().returnWith("fakeJsonData");
    consumeFirstDocToImportMock = sm.mock();
    notifyImportEndMock = sm.mock();
    getFolderIdMock = sm.mock().resolveWith(42);
    displayImportErrorPromptMock = sm.mock();
    displayImportErrorReportMock = sm.mock();
    moveDocsFromErrorToImportMock = sm.mock();
    // to not trigger message box during tests
    showMessageBoxMock = sm
      .mock(remote.dialog, "showMessageBox")
      .resolveWith("");
    createThumbFromFileMock = sm
      .mock(thumbnailGenerator, "createThumbFromFile")
      .resolveWith("fakeThumb");
    htmlReportSaveMock = sm.mock().returnWith("fakeReportPath");
    htmlReportConstructorMock = sm
      .mock(reportTools, "HtmlReport")
      .returnWith({ save: htmlReportSaveMock });
    readFileSyncMock = sm
      .mock(fs, "readFileSync")
      .resolveWith({ buffer: new ArrayBuffer(8) });

    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.import.mutations.SET_DOCS_TO_IMPORT = setDocsToImportMock;
    storeConfigCopy.modules.import.mutations.MOVE_FIRST_DOC_FROM_IMPORT_TO_ERROR = moveFirstDocFromImportToErrorMock;
    storeConfigCopy.modules.import.mutations.MOVE_DOCS_FROM_ERROR_TO_IMPORT = moveDocsFromErrorToImportMock;
    storeConfigCopy.modules.tools.actions.hashFile = hashFileMock;
    storeConfigCopy.modules.tools.actions.hashString = hashStringMock;
    storeConfigCopy.modules.import.actions.consumeFirstDocToImport = consumeFirstDocToImportMock;
    store = new Vuex.Store(storeConfigCopy);

    wrapper = shallowMount(ImportTab, {
      localVue,
      store,
      propsData: {
        actionInterrupted: false,
        performRetry: false,
      },
      computed: {
        docsToImport: {
          cache: false,
          get: docsToImportMock,
        },
        docsMetadataToImport: {
          cache: false,
          get: docsMetadataToImport,
        },
        savedImportDestination: {
          cache: false,
          get: savedImportDestinationMock,
        },
        importDocsInError: {
          cache: false,
          get: importDocsInErrorMock,
        },
        accessToken: {
          cache: false,
          get: accessTokenMock,
        },
        folderDestinationName: folderDestinationNameMock,
      },
      methods: {
        proceedToImport: proceedToImportMock,
        resetDataImportStart: resetDataImportStartMock,
        resetDataImportEnd: resetDataImportEndMock,
        getOrCreateDocumentFolder: getOrCreateDocumentFolderMock,
        createFolderPath: createFolderPathMock,
        getFileAndMd5FromSerializedDocument: getFileAndMd5FromSerializedDocumentMock,
        constructJsonData: constructJsonDataMock,
        notifyImportEnd: notifyImportEndMock,
        getFolderId: getFolderIdMock,
        displayImportErrorPrompt: displayImportErrorPromptMock,
        displayImportErrorReport: displayImportErrorReportMock,
      },
    });
  });

  afterEach(() => {
    sm.restore();
    proceedToImportMock.reset();
    resetDataImportStartMock.reset();
    resetDataImportEndMock.reset();
    docsToImportMock.actions = [];
    docsMetadataToImport.actions = [];
    getOrCreateDocumentFolderMock.actions = [];
    moveFirstDocFromImportToErrorMock.actions = [];
    mockedSavedImportDestinationValue.actions = [];
    getFolderIdMock.actions = [];
    listFoldersMock.actions = [];
    uploadDocumentMock.reset();
    createFolderMock.reset();
    listFoldersMock.reset();
  });

  it("prepareImport store document in store if needed", () => {
    // given there are no files or filesInsideFolder
    wrapper.setData({ files: [], filesInsideFolder: [] });

    wrapper.vm.prepareImport(true);

    // then no commit is done
    expect(setDocsToImportMock.callCount).to.equal(0);

    // given there are files or filesInsideFolder
    wrapper.setData({
      filesInsideFolder: [
        tv.FILES_PROPS,
        tv.FILES_PROPS_2,
        tv.FILES_PROPS_3,
        tv.FILES_PROPS_TYPE_KO,
      ],
    });

    wrapper.vm.prepareImport(true);

    // then
    expect(setDocsToImportMock.callCount).to.equal(1);
    // only FILES_PROPS and FILES_PROPS_2 are committed
    expect(setDocsToImportMock.lastCall.args[1]).to.eql([
      tv.FILES_PROPS,
      tv.FILES_PROPS_2,
      tv.FILES_PROPS_3,
    ]);
  });

  it("prepareImport set settingDocumentsMetadata or call proceedToImport properly", () => {
    wrapper.setData({ settingDocumentsMetadata: false });

    // if importingMetadata true
    wrapper.vm.prepareImport(true);

    // then
    expect(wrapper.vm.settingDocumentsMetadata).to.equal(true);
    expect(proceedToImportMock.callCount).to.equal(0);

    wrapper.setData({ settingDocumentsMetadata: false });
    // if importingMetadata false
    wrapper.vm.prepareImport(false);

    // then
    expect(wrapper.vm.settingDocumentsMetadata).to.equal(false);
    expect(proceedToImportMock.callCount).to.equal(1);
  });

  it("resetDataImportStart reset settingDocumentsMetadata and createdFoldersCache properly", () => {
    // restore original method to test it
    wrapper.setMethods({
      resetDataImportStart: ImportTab.methods.resetDataImportStart,
    });
    wrapper.setData({
      settingDocumentsMetadata: true,
      createdFoldersCache: "someCache",
    });

    // if importingMetadata true
    wrapper.vm.resetDataImportStart();

    // then
    expect(wrapper.vm.settingDocumentsMetadata).to.equal(false);
    expect(wrapper.vm.createdFoldersCache).to.eql({});
  });

  it("resetDataImportEnd reset importing, files and filesInsideFolder properly", () => {
    // restore original method to test it
    wrapper.setMethods({
      resetDataImportEnd: ImportTab.methods.resetDataImportEnd,
    });
    wrapper.setData({
      importing: true,
      files: [tv.FILES_PROPS],
      filesInsideFolder: [tv.FILES_PROPS_2],
    });

    // if importingMetadata true
    wrapper.vm.resetDataImportEnd();

    // then
    expect(wrapper.vm.importing).to.equal(false);
    expect(wrapper.vm.files).to.eql([]);
    expect(wrapper.vm.filesInsideFolder).to.eql([]);
  });

  it("proceedToImport call resetDataImportStart and resetDataImportEnd", () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });

    wrapper.vm.proceedToImport();

    expect(resetDataImportStartMock.callCount).to.equal(1);
    expect(resetDataImportEndMock.callCount).to.equal(1);
  });

  it("proceedToImport emit event-importing and event-import-end", async () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });
    // set new return value for docsToImportMock
    let mockedDocsToImportValue = [tv.FILES_PROPS];
    docsToImportMock.actions = [];
    docsToImportMock.returnWith(mockedDocsToImportValue);
    // Mock behavior of consumeFirstDocToImport by consuming first mockedDocsToImportValue item at each call
    // without this, proceedToImport while would cause an infinite loop
    consumeFirstDocToImportMock.callFn(() => {
      docsToImportMock.actions = [];
      mockedDocsToImportValue.shift();
      docsToImportMock.returnWith(mockedDocsToImportValue);
    });

    const testedEvent1 = "event-importing";
    const testedEvent2 = "event-import-end";

    await wrapper.vm.proceedToImport();

    expect(wrapper.emitted(testedEvent1)).to.not.be.undefined;
    expect(wrapper.emitted(testedEvent1).length).to.equal(1);
    expect(wrapper.emitted(testedEvent1)[0]).to.be.eql([
      {
        currentCount: 0,
        totalCount: 1,
      },
    ]);
    expect(wrapper.emitted(testedEvent2)).to.not.be.undefined;
    expect(wrapper.emitted(testedEvent2).length).to.equal(1);
  });

  it("proceedToImport call getOrCreateDocumentFolder", async () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });
    // set new return value for docsToImportMock
    let mockedDocsToImportValue = [tv.FILES_PROPS];
    docsToImportMock.actions = [];
    docsToImportMock.returnWith(mockedDocsToImportValue);
    // Mock behavior of consumeFirstDocToImport by consuming first mockedDocsToImportValue item at each call
    // without this, proceedToImport while would cause an infinite loop
    consumeFirstDocToImportMock.callFn(() => {
      docsToImportMock.actions = [];
      mockedDocsToImportValue.shift();
      docsToImportMock.returnWith(mockedDocsToImportValue);
    });

    await wrapper.vm.proceedToImport();

    // createFolderPath is called for the items in docsToImport
    expect(getOrCreateDocumentFolderMock.callCount).to.be.equal(1);
    expect(getOrCreateDocumentFolderMock.calls[0].arg).to.be.eql(
      tv.FILES_PROPS
    );
  });

  it("proceedToImport handle getOrCreateDocumentFolder error properly", async () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });
    // make getOrCreateDocumentFolder return an error
    getOrCreateDocumentFolderMock.actions = [];
    getOrCreateDocumentFolderMock.rejectWith("Boom!");
    // set new return value for docsToImportMock
    let mockedDocsToImportValue = [tv.FILES_PROPS];
    docsToImportMock.actions = [];
    docsToImportMock.returnWith(mockedDocsToImportValue);
    // Mock behavior of moveFirstDocFromImportToErrorMock by consuming first mockedDocsToImportValue item at each call
    // without this, proceedToImport while would cause an infinite loop
    moveFirstDocFromImportToErrorMock.callFn(() => {
      docsToImportMock.actions = [];
      mockedDocsToImportValue.shift();
      docsToImportMock.returnWith(mockedDocsToImportValue);
    });

    await wrapper.vm.proceedToImport();

    // moveFirstDocFromImportToErrorMock call 1 time (docsToImportMock length)
    expect(moveFirstDocFromImportToErrorMock.callCount).to.be.equal(1);
    expect(moveFirstDocFromImportToErrorMock.lastCall.args[1]).to.be.equal(
      "Parent folder creation failed"
    );
    // getFileAndMd5FromSerializedDocumentMock not call because document was skipped due to error
    expect(getFileAndMd5FromSerializedDocumentMock.callCount).to.be.equal(0);
  });

  it("proceedToImport call getFileAndMd5FromSerializedDocument", async () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });
    // set new return value for docsToImportMock
    let mockedDocsToImportValue = [tv.FILES_PROPS];
    docsToImportMock.actions = [];
    docsToImportMock.returnWith(mockedDocsToImportValue);
    // Mock behavior of consumeFirstDocToImport by consuming first mockedDocsToImportValue item at each call
    // without this, proceedToImport while would cause an infinite loop
    consumeFirstDocToImportMock.callFn(() => {
      docsToImportMock.actions = [];
      mockedDocsToImportValue.shift();
      docsToImportMock.returnWith(mockedDocsToImportValue);
    });

    await wrapper.vm.proceedToImport();

    // moveFirstDocFromImportToErrorMock call 1 time (docsToImportMock length)
    expect(getFileAndMd5FromSerializedDocumentMock.callCount).to.be.equal(1);
    expect(
      getFileAndMd5FromSerializedDocumentMock.lastCall.args[0]
    ).to.be.equal(tv.FILES_PROPS);
  });

  it("proceedToImport handle getFileAndMd5FromSerializedDocument error properly", async () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });
    // make getOrCreateDocumentFolder return an error
    getFileAndMd5FromSerializedDocumentMock.actions = [];
    getFileAndMd5FromSerializedDocumentMock.rejectWith("Boom!");
    // set new return value for docsToImportMock
    let mockedDocsToImportValue = [tv.FILES_PROPS];
    docsToImportMock.actions = [];
    docsToImportMock.returnWith(mockedDocsToImportValue);
    // Mock behavior of moveFirstDocFromImportToErrorMock by consuming first mockedDocsToImportValue item at each call
    // without this, proceedToImport while would cause an infinite loop
    moveFirstDocFromImportToErrorMock.callFn(() => {
      docsToImportMock.actions = [];
      mockedDocsToImportValue.shift();
      docsToImportMock.returnWith(mockedDocsToImportValue);
    });

    await wrapper.vm.proceedToImport();

    // moveFirstDocFromImportToErrorMock call 1 time (docsToImportMock length)
    expect(moveFirstDocFromImportToErrorMock.callCount).to.be.equal(1);
    expect(moveFirstDocFromImportToErrorMock.lastCall.args[1]).to.be.equal(
      "File not found (deleted, renamed or moved?)"
    );
    // constructJsonData not call because document was skipped due to error
    expect(constructJsonDataMock.callCount).to.be.equal(0);
  });

  it("proceedToImport call constructJsonData", async () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });
    // set new return value for docsToImportMock
    let mockedDocsToImportValue = [tv.FILES_PROPS];
    docsToImportMock.actions = [];
    docsToImportMock.returnWith(mockedDocsToImportValue);
    // Mock behavior of consumeFirstDocToImport by consuming first mockedDocsToImportValue item at each call
    // without this, proceedToImport while would cause an infinite loop
    consumeFirstDocToImportMock.callFn(() => {
      docsToImportMock.actions = [];
      mockedDocsToImportValue.shift();
      docsToImportMock.returnWith(mockedDocsToImportValue);
    });

    await wrapper.vm.proceedToImport();

    // moveFirstDocFromImportToErrorMock call 1 time (docsToImportMock length)
    expect(constructJsonDataMock.callCount).to.be.equal(1);
    expect(constructJsonDataMock.lastCall.args).to.be.eql([
      "fakeFolderId",
      tv.FILES_PROPS.lastModified,
      "fakeMd5",
      tv.FILES_PROPS.path,
    ]);
  });

  it("proceedToImport call createThumbFromFile if needed", async () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });
    // set new return value for docsToImportMock
    let mockedDocsToImportValue = [tv.FILES_PROPS, tv.FILES_PROPS_2];
    docsToImportMock.actions = [];
    docsToImportMock.returnWith(mockedDocsToImportValue);
    // Mock behavior of consumeFirstDocToImport by consuming first mockedDocsToImportValue item at each call
    // without this, proceedToImport while would cause an infinite loop
    consumeFirstDocToImportMock.callFn(() => {
      docsToImportMock.actions = [];
      mockedDocsToImportValue.shift();
      docsToImportMock.returnWith(mockedDocsToImportValue);
    });
    // Second document is NOT a PDF
    getFileAndMd5FromSerializedDocumentMock.resolveWith({
      file: tv.FILES_PROPS_2,
      md5: "fakeMd5",
    });

    await wrapper.vm.proceedToImport();

    // createThumbFromFileMock call 1 time (only for PDF doc)
    expect(createThumbFromFileMock.callCount).to.be.equal(1);
    expect(createThumbFromFileMock.lastCall.args[0]).to.be.equal(
      tv.FILES_PROPS
    );
  });

  it("proceedToImport handle createThumbFromFile error properly", async () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });
    // make getOrCreateDocumentFolder return an error
    createThumbFromFileMock.actions = [];
    createThumbFromFileMock.rejectWith("Boom!");
    // set new return value for docsToImportMock
    let mockedDocsToImportValue = [tv.FILES_PROPS];
    docsToImportMock.actions = [];
    docsToImportMock.returnWith(mockedDocsToImportValue);
    // Mock behavior of consumeFirstDocToImport by consuming first mockedDocsToImportValue item at each call
    // without this, proceedToImport while would cause an infinite loop
    consumeFirstDocToImportMock.callFn(() => {
      docsToImportMock.actions = [];
      mockedDocsToImportValue.shift();
      docsToImportMock.returnWith(mockedDocsToImportValue);
    });

    await wrapper.vm.proceedToImport();

    // createThumbFromFile error are ignored, it does not skip the current document processing (= next method is called)
    expect(uploadDocumentMock.callCount).to.be.equal(1);
  });

  it("proceedToImport call uploadDocument", async () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });
    // set new return value for docsToImportMock
    let mockedDocsToImportValue = [tv.FILES_PROPS];
    docsToImportMock.actions = [];
    docsToImportMock.returnWith(mockedDocsToImportValue);
    // Mock behavior of consumeFirstDocToImport by consuming first mockedDocsToImportValue item at each call
    // without this, proceedToImport while would cause an infinite loop
    consumeFirstDocToImportMock.callFn(() => {
      docsToImportMock.actions = [];
      mockedDocsToImportValue.shift();
      docsToImportMock.returnWith(mockedDocsToImportValue);
    });

    await wrapper.vm.proceedToImport();

    // moveFirstDocFromImportToErrorMock call 1 time (docsToImportMock length)
    expect(uploadDocumentMock.callCount).to.be.equal(1);
    expect(uploadDocumentMock.lastCall.args).to.be.eql([
      "fakeAccessToken",
      "fakeJsonData",
      tv.FILES_PROPS,
      "fakeThumb",
    ]);
    expect(consumeFirstDocToImportMock.callCount).to.be.equal(1);
  });

  it("proceedToImport handle uploadDocument error properly", async () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });
    // make getOrCreateDocumentFolder return an error
    uploadDocumentMock.actions = [];
    uploadDocumentMock.rejectWith("Boom!");
    // set new return value for docsToImportMock
    let mockedDocsToImportValue = [tv.FILES_PROPS];
    docsToImportMock.actions = [];
    docsToImportMock.returnWith(mockedDocsToImportValue);
    // Mock behavior of moveFirstDocFromImportToErrorMock by consuming first mockedDocsToImportValue item at each call
    // without this, proceedToImport while would cause an infinite loop
    moveFirstDocFromImportToErrorMock.callFn(() => {
      docsToImportMock.actions = [];
      mockedDocsToImportValue.shift();
      docsToImportMock.returnWith(mockedDocsToImportValue);
    });

    await wrapper.vm.proceedToImport();

    // moveFirstDocFromImportToErrorMock call 1 time (docsToImportMock length)
    expect(moveFirstDocFromImportToErrorMock.callCount).to.be.equal(1);
    expect(moveFirstDocFromImportToErrorMock.lastCall.args[1]).to.be.equal(
      "Upload error (corrupt file, network error?)"
    );
  });

  it("proceedToImport call notifyImportEnd properly", () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToImport: ImportTab.methods.proceedToImport });

    wrapper.vm.proceedToImport();

    expect(notifyImportEndMock.callCount).to.be.equal(1);
    expect(notifyImportEndMock.lastCall.args).to.be.eql([0]); // docsToImport length
  });

  it("createFolderPath request api createFolder if needed", async () => {
    // restore original method to test it
    wrapper.setMethods({
      createFolderPath: ImportTab.methods.createFolderPath,
    });
    // folder 2 is already cached and wont be created
    wrapper.setData({
      createdFoldersCache: {
        "/fakeImportDestination/folder2": 2,
      },
    });
    const fakeFolderPath = "folder1/folder2/folder3/folder4/filename";
    createFolderMock.actions = [];
    createFolderMock
      .resolveWith({
        data: {
          id: 3,
        },
      })
      .resolveWith({
        data: {
          id: 4,
        },
      });

    const testedValue = await wrapper.vm.createFolderPath(fakeFolderPath);

    // api is call to create folder 3 and 4 (folder1 replaced by selected destination folder)
    expect(createFolderMock.callCount).to.be.equal(2);
    expect(createFolderMock.calls[0].args).to.be.eql([
      "fakeAccessToken",
      "folder3",
      2,
    ]);
    expect(createFolderMock.calls[1].args).to.be.eql([
      "fakeAccessToken",
      "folder4",
      3,
    ]);
    // created folders have been cached
    expect(
      wrapper.vm.createdFoldersCache["/fakeImportDestination/folder2/folder3"]
    ).to.be.equal(3);
    expect(
      wrapper.vm.createdFoldersCache[
        "/fakeImportDestination/folder2/folder3/folder4"
      ]
    ).to.be.equal(4);
    // method return id of parent folder
    expect(testedValue).to.be.equal(4);
  });

  it("createFolderPath handle api createFolder error", async () => {
    // restore original method to test it
    wrapper.setMethods({
      createFolderPath: ImportTab.methods.createFolderPath,
    });
    const fakeFolderPath = "folder1/folder2/folder3/filename";
    createFolderMock.actions = [];
    // folder 2 already exist
    createFolderMock
      .rejectWith({
        response: {
          data: {
            code: "folder_name_unique_for_org_level",
          },
        },
      })
      // unexpected error during folder 3 creation
      .resolveWith({
        response: "",
      });

    let testedValue;
    await wrapper.vm.createFolderPath(fakeFolderPath).catch((error) => {
      testedValue = error;
    });

    // api is call to create folder 3 and 4 (folder1 replaced by selected destination folder)
    expect(createFolderMock.callCount).to.be.equal(2);
    expect(createFolderMock.calls[0].args).to.be.eql([
      "fakeAccessToken",
      "folder2",
      1,
    ]);
    expect(createFolderMock.calls[1].args).to.be.eql([
      "fakeAccessToken",
      "folder3",
      42,
    ]); // 42 is returned by getFolderIdMock
    expect(getFolderIdMock.callCount).to.be.equal(1);
    expect(getFolderIdMock.calls[0].args).to.be.eql([1, "folder2"]);
    // already created folder have been cached
    expect(
      wrapper.vm.createdFoldersCache["/fakeImportDestination/folder2"]
    ).to.be.equal(42);
    // folder for which error occurred aren't cached
    expect(wrapper.vm.createdFoldersCache).to.not.have.property(
      "/fakeImportDestination/folder2/folder3"
    );
    // method return proper error message
    expect(testedValue).to.be.equal("Unexpected error during folder creation");
  });

  it("getFolderId request api listFolders", async () => {
    // restore original method to test it
    wrapper.setMethods({ getFolderId: ImportTab.methods.getFolderId });
    listFoldersMock.resolveWith({
      data: [
        { name: "mysteriousFolder", id: 42 },
        { name: "randomFolder", id: 1 },
      ],
    });

    const testedValue = await wrapper.vm.getFolderId(24, "mysteriousFolder");

    // api is call to list folders inside parent
    expect(listFoldersMock.callCount).to.be.equal(1);
    expect(listFoldersMock.lastCall.args).to.be.eql(["fakeAccessToken", 24]);
    expect(testedValue).to.be.equal(42);
  });

  it("getFolderId handle folder missing from api response", async () => {
    // restore original method to test it
    wrapper.setMethods({ getFolderId: ImportTab.methods.getFolderId });
    listFoldersMock.resolveWith({
      data: [
        { name: "randomFolder", id: 1 },
        { name: "randomFolder2", id: 2 },
      ],
    });

    let testedValue;
    await wrapper.vm.getFolderId(24, "mysteriousFolder").catch((error) => {
      testedValue = error;
    });

    // api is call to list folders inside parent
    expect(listFoldersMock.callCount).to.be.equal(1);
    expect(listFoldersMock.lastCall.args).to.be.eql(["fakeAccessToken", 24]);
    expect(testedValue).to.be.equal("Fail to get folder id");
  });

  it("getFolderId handle api listFolders error", async () => {
    // restore original method to test it
    wrapper.setMethods({ getFolderId: ImportTab.methods.getFolderId });
    listFoldersMock.rejectWith("Boom!");

    let testedValue;
    await wrapper.vm.getFolderId(24, "mysteriousFolder").catch((error) => {
      testedValue = error;
    });

    // api is call to list folders inside parent
    expect(listFoldersMock.callCount).to.be.equal(1);
    expect(listFoldersMock.lastCall.args).to.be.eql(["fakeAccessToken", 24]);
    expect(testedValue).to.be.equal("Boom!");
  });

  it("displayImportErrorPrompt call remote.dialog.showMessageBox", async () => {
    // restore original method to test it
    wrapper.setMethods({
      displayImportErrorPrompt: ImportTab.methods.displayImportErrorPrompt,
    });

    await wrapper.vm.displayImportErrorPrompt(1);

    // api is call to list folders inside parent
    expect(showMessageBoxMock.callCount).to.be.equal(1);
    expect(showMessageBoxMock.lastCall.args[1]).to.includes({ type: "error" });
  });

  it("displayImportErrorPrompt call displayImportErrorReport if needed and commit MOVE_DOCS_FROM_ERROR_TO_IMPORT to store", async () => {
    // restore original method to test it
    wrapper.setMethods({
      displayImportErrorPrompt: ImportTab.methods.displayImportErrorPrompt,
    });
    showMessageBoxMock.actions = [];
    showMessageBoxMock.resolveWith({ response: 1 }); // confirmation button clicked on the message box

    await wrapper.vm.displayImportErrorPrompt(1);

    // api is call to list folders inside parent
    expect(displayImportErrorReportMock.callCount).to.be.equal(1);
    expect(moveDocsFromErrorToImportMock.callCount).to.be.equal(1);
  });

  it("getOrCreateDocumentFolder call createFolderPath if needed", async () => {
    // restore original method to test it
    wrapper.setMethods({
      getOrCreateDocumentFolder: ImportTab.methods.getOrCreateDocumentFolder,
    });

    // when passing a file with a webkitRelativePath attribute
    let testedValue = await wrapper.vm.getOrCreateDocumentFolder(
      tv.FILES_PROPS
    );

    // createFolderPath is called using the file webkitRelativePath
    expect(createFolderPathMock.callCount).to.be.equal(1);
    expect(createFolderPathMock.lastCall.arg).to.equal(
      tv.FILES_PROPS.webkitRelativePath
    );
    // it return the value returned by createFolderPath
    expect(testedValue).to.equal("fakeFolderId");

    // when passing a file without webkitRelativePath
    testedValue = await wrapper.vm.getOrCreateDocumentFolder(
      tv.FILES_PROPS_NO_RELATIVE_PATH
    );

    // it return the import destination folder id
    expect(testedValue).to.be.equal(mockedSavedImportDestinationValue.id);
  });

  it("constructJsonData format data properly when there is NO metadata matching document", async () => {
    // restore original method to test it
    wrapper.setMethods({
      constructJsonData: ImportTab.methods.constructJsonData,
    });

    let testedValue = await wrapper.vm.constructJsonData(
      42,
      tv.FILES_PROPS.lastModified,
      "fakeMd5",
      "fake/path"
    );

    expect(testedValue).to.be.eql({
      ftl_folder: 42,
      created: "2019-09-03T14:44:55.187Z",
      md5: "fakeMd5",
    });
  });

  it("constructJsonData format data properly when there is metadata matching document", async () => {
    // restore original method to test it
    wrapper.setMethods({
      constructJsonData: ImportTab.methods.constructJsonData,
    });
    const docMetadata = {
      documentTitle: "fakeDocTitle",
      documentNotes: "fakeDoc notes",
    };
    docsMetadataToImport.actions = [];
    docsMetadataToImport.returnWith({ fakeMd5: docMetadata });
    hashStringMock.returnWith("fakeMd5");

    let testedValue = await wrapper.vm.constructJsonData(
      42,
      tv.FILES_PROPS.lastModified,
      "fakeMd5",
      "fake/path"
    );

    expect(hashStringMock.callCount).to.be.equal(1);
    expect(hashStringMock.lastCall.args[1]).to.be.eql({
      algorithm: "md5",
      string: "fake/path",
    });
    expect(testedValue).to.be.eql({
      ftl_folder: 42,
      created: "2019-09-03T14:44:55.187Z",
      md5: "fakeMd5",
      title: docMetadata.documentTitle,
      note: docMetadata.documentNotes,
    });
  });

  it("getFileAndMd5FromSerializedDocument return File object", async () => {
    // restore original method to test it
    wrapper.setMethods({
      getFileAndMd5FromSerializedDocument:
        ImportTab.methods.getFileAndMd5FromSerializedDocument,
    });
    hashFileMock.returnWith("fakeMd5");

    let testedValue = await wrapper.vm.getFileAndMd5FromSerializedDocument(
      tv.FILES_PROPS
    );

    // the file have been read by Node
    expect(readFileSyncMock.callCount).to.be.equal(1);
    expect(readFileSyncMock.lastCall.arg).to.be.equal(tv.FILES_PROPS.path);
    // File object and md5 of file is returned
    expect(testedValue.file).to.be.an.instanceof(File);
    expect(testedValue.md5).to.be.equal("fakeMd5");
  });

  it("getFileAndMd5FromSerializedDocument handle error during file read", async () => {
    // restore original method to test it
    wrapper.setMethods({
      getFileAndMd5FromSerializedDocument:
        ImportTab.methods.getFileAndMd5FromSerializedDocument,
    });
    readFileSyncMock.actions = [];
    readFileSyncMock.throwWith("Boom!");

    let testedValue;
    await wrapper.vm
      .getFileAndMd5FromSerializedDocument(tv.FILES_PROPS)
      .catch((error) => {
        testedValue = error;
      });

    // File object and md5 of file is returned
    expect(testedValue).to.be.equal("Boom!");
  });

  it("displayImportErrorReport instantiate Html report, save it and open it", async () => {
    // restore original method to test it
    wrapper.setMethods({
      displayImportErrorReport: ImportTab.methods.displayImportErrorReport,
    });
    importDocsInErrorMock.actions = [];
    importDocsInErrorMock.returnWith([
      {
        name: tv.FILES_PROPS.name,
        path: tv.FILES_PROPS.path,
        reason: "boom",
      },
      {
        name: tv.FILES_PROPS_2.name,
        path: tv.FILES_PROPS_2.path,
        reason: "kaBoom",
      },
    ]);

    wrapper.vm.displayImportErrorReport();

    // File object and md5 of file is returned
    expect(htmlReportConstructorMock.callCount).to.be.equal(1);
    expect(htmlReportConstructorMock.lastCall.args[1]).to.be.eql([
      [tv.FILES_PROPS.name, tv.FILES_PROPS.path, "boom"],
      [tv.FILES_PROPS_2.name, tv.FILES_PROPS_2.path, "kaBoom"],
    ]);
    expect(htmlReportSaveMock.callCount).to.be.equal(1);
    expect(openExternalMock.callCount).to.be.equal(1);
    expect(openExternalMock.lastCall.arg).to.be.equal("file:///fakeReportPath");
  });

  it("notifyImportEnd call displayImportErrorReport or electron showMessageBox if needed", () => {
    // restore original method to test it
    wrapper.setMethods({ notifyImportEnd: ImportTab.methods.notifyImportEnd });

    // if has been disconnected during import
    accessTokenMock.actions = [];
    accessTokenMock.returnWith("");

    wrapper.vm.notifyImportEnd();

    // a message indicate user that import have been interrupted and can be resumed
    expect(displayImportErrorPromptMock.callCount).to.be.equal(0);
    expect(showMessageBoxMock.callCount).to.be.equal(1);
    expect(showMessageBoxMock.lastCall.args[1]).to.includes({ type: "error" });

    showMessageBoxMock.reset();

    // when user is still logged and there is no error
    accessTokenMock.actions = [];
    accessTokenMock.returnWith("fakeAccessToken");
    importDocsInErrorMock.actions = [];
    importDocsInErrorMock.returnWith([]);

    wrapper.vm.notifyImportEnd();

    // success message is displayed
    expect(displayImportErrorPromptMock.callCount).to.be.equal(0);
    expect(showMessageBoxMock.callCount).to.be.equal(1);
    expect(showMessageBoxMock.lastCall.args[1]).to.includes({ type: "info" });

    showMessageBoxMock.reset();

    // when user is still logged and there is at least one error
    accessTokenMock.actions = [];
    accessTokenMock.returnWith("fakeAccessToken");
    importDocsInErrorMock.actions = [];
    importDocsInErrorMock.returnWith(["doc1"]);

    wrapper.vm.notifyImportEnd();

    // success message is displayed
    expect(displayImportErrorPromptMock.callCount).to.be.equal(1);
    expect(displayImportErrorPromptMock.lastCall.args[0]).to.equal(1); // importDocsInError length
    expect(showMessageBoxMock.callCount).to.be.equal(0);

    showMessageBoxMock.reset();
  });
});
