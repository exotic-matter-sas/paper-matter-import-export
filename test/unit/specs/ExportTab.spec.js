/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { createLocalVue, shallowMount } from "@vue/test-utils";
import sm from "simple-mock"

import BootstrapVue from "bootstrap-vue";
import Vuex from "vuex";
import storeConfig from "../../../src/renderer/store";

import ExportTab from "../../../src/renderer/components/HomePage/ExportTab";
import * as tv from "../../tools/testValues";
import {remote} from "electron";
import {PassThrough} from "stream";
import * as fastCsv from '@fast-csv/format';
import {reportTools} from "../../../src/renderer/htmlReport";
import fs from "fs";
import cloneDeep from "lodash.clonedeep";
import flushPromises from "flush-promises"

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
  shell: {openExternal: openExternalMock}
}; // electron prototype mock

const listDocumentsApiMock = sm.mock();
const arrayBufferMock = new ArrayBuffer(8);
const downloadDocumentAsArrayBufferMock = sm.mock().resolveWith({data: arrayBufferMock});
const apiMock = {
  listDocuments: listDocumentsApiMock,
  downloadDocumentAsArrayBuffer: downloadDocumentAsArrayBufferMock
};
localVue.prototype.$api = apiMock; // api prototype mock

// Attach Vue plugins here (after mocking prototypes)
localVue.use(Vuex);
localVue.use(BootstrapVue); // avoid bootstrap vue warnings
localVue.component("font-awesome-icon"); // avoid font awesome warnings

describe("ExportTab template", () => {
  // define all var needed for the test here
  let wrapper;
  let store;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    store = new Vuex.Store(storeConfig);
    wrapper = shallowMount(ExportTab, {
      localVue,
      store,
      propsData: {
        exportInterrupted: false
      },
    });
  });

  afterEach(() => {
    sm.restore();
  });

  it("renders properly html element", () => {
    const elementSelector = "#export-tab-content";
    const elem = wrapper.find(elementSelector);
    expect(elem.is(elementSelector)).to.equal(true);
  });
});

describe("ExportTab mounted", () => {
  let wrapper;
  let store;
  let storeConfigCopy;
  let docsToExportMock;
  let exportDocsInErrorMock;
  let showMessageBoxMock;
  let displayExportErrorPromptMock;

  beforeEach(() => {
    showMessageBoxMock = sm.mock(remote.dialog, "showMessageBox").returnWith('');
    displayExportErrorPromptMock = sm.mock();
    docsToExportMock = sm.mock();
    exportDocsInErrorMock = sm.mock();

    storeConfigCopy = cloneDeep(storeConfig);
    store = new Vuex.Store(storeConfigCopy);
  });

  afterEach(() => {
    sm.restore();
    docsToExportMock.actions = [];
    exportDocsInErrorMock.actions = [];
  });

  it("do not display resume message box or import error prompt if not needed", () => {
    docsToExportMock.returnWith([]);
    exportDocsInErrorMock.returnWith([]);
    // wrapper have to be define after computed values have been mocked
    wrapper = shallowMount(ExportTab, {
      localVue,
      store,
      computed: {
        docsToExport: docsToExportMock,
        exportDocsInError: exportDocsInErrorMock
      },
      methods: {
        displayExportErrorPrompt: displayExportErrorPromptMock
      }
    });

    expect(showMessageBoxMock.callCount).to.equal(0);
    expect(displayExportErrorPromptMock.callCount).to.equal(0);
  });

  it("display resume message box if needed", () => {
    docsToExportMock.returnWith(['doc1']);
    exportDocsInErrorMock.returnWith([]);
    // wrapper have to be define after computed values have been mocked
    wrapper = shallowMount(ExportTab, {
      localVue,
      store,
      computed: {
        docsToExport: docsToExportMock,
        exportDocsInError: exportDocsInErrorMock
      },
      methods: {
        displayExportErrorPrompt: displayExportErrorPromptMock
      }
    });

    expect(showMessageBoxMock.callCount).to.equal(1);
    expect(displayExportErrorPromptMock.callCount).to.equal(0);
  });

  it("display import error prompt needed", () => {
    docsToExportMock.returnWith([]);
    exportDocsInErrorMock.returnWith(['doc1']);
    // wrapper have to be define after computed values have been mocked
    wrapper = shallowMount(ExportTab, {
      localVue,
      store,
      computed: {
        docsToExport: docsToExportMock,
        exportDocsInError: exportDocsInErrorMock
      },
      methods: {
        displayExportErrorPrompt: displayExportErrorPromptMock
      }
    });

    expect(showMessageBoxMock.callCount).to.equal(0);
    expect(displayExportErrorPromptMock.callCount).to.equal(1);
  });
});

describe("ExportTab computed", () => {
  // define all var needed for the test here
  let wrapper;
  let store;
  let savedExportSourceMock;
  let showMessageBoxMock;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    store = new Vuex.Store(storeConfig);
    savedExportSourceMock = sm.mock();
    showMessageBoxMock = sm.mock(remote.dialog, "showMessageBox").returnWith('');
  });

  afterEach(() => {
    sm.restore();
    savedExportSourceMock.actions = [];
  });

  it("folderSourceName return proper value when folder is Root", () => {
    savedExportSourceMock.returnWith({name: 'Root', id: null});
    wrapper = shallowMount(ExportTab, {
      localVue,
      store,
      propsData:{
        actionInterrupted: false
      },
      computed: {
        savedExportSource: savedExportSourceMock,
      }
    });

    let testedValue = wrapper.vm.folderSourceName;

    expect(testedValue).to.be.equal('rootFolderName');
  });

  it("folderSourceName return proper value when folder is NOT Root", () => {
    const fakeFolderName = 'FakeFolder';
    savedExportSourceMock.returnWith({name: fakeFolderName, id: null});
    // mock returnWith isn't working if done after shallowMount, due to Vue computed cache perhaps?
    wrapper = shallowMount(ExportTab, {
      localVue,
      store,
      propsData:{
        actionInterrupted: false
      },
      computed: {
        savedExportSource: savedExportSourceMock,
      }
    });

    let testedValue = wrapper.vm.folderSourceName;

    expect(testedValue).to.be.equal(fakeFolderName);
  });
});

describe("ExporTab methods", () => {
  // define all var needed for the test here
  let wrapper;
  let storeConfigCopy;
  let store;
  let docsToExportMock;
  let setDocsToExportMock;
  let setDuplicatedFilePathCountMock;
  let moveDocsFromErrorToExportMock;
  let setExportDestinationMock;
  let setExportFolderNameMock;
  let mockedSavedExportSourceMockValue;
  let savedExportSourceMock;
  let exportDocsInErrorMock;
  let accessTokenMock;
  let folderSourceNameMock;
  let proceedToExportMock;
  let listAllDocumentsMock;
  let promiseMkdirMock;
  let savedExportDestinationMock;
  let exportFolderNameMock;
  let metadataExportSkippedMock;
  let duplicatedFilePathCountMock;
  let resetDataExportStartMock;
  let showOpenDialogMock;
  let getDocDirAbsolutePathMock;
  let getDocAbsolutePathMock;
  let downloadDocumentAndCheckIntegrityMock;
  let displayExportErrorReportMock;
  let notifyExportEndMock;
  let displayExportErrorPromptMock;
  let hashFileMock;
  let hashStringMock;
  let promiseWriteFileMock;
  let showMessageBoxMock;
  let htmlReportSaveMock;
  let htmlReportConstructorMock;
  let mkdirSyncMock;
  let skipMetadataExportMock;
  let createWriteStreamMock;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    docsToExportMock = sm.mock().returnWith([]);
    setDocsToExportMock = sm.mock();
    setDuplicatedFilePathCountMock = sm.mock();
    moveDocsFromErrorToExportMock = sm.mock();
    setExportDestinationMock = sm.mock();
    setExportFolderNameMock = sm.mock();
    skipMetadataExportMock = sm.mock();
    mockedSavedExportSourceMockValue = {id: 1, name: 'fakeExportSource'};
    savedExportSourceMock = sm.mock().returnWith(mockedSavedExportSourceMockValue);
    exportDocsInErrorMock = sm.mock().returnWith([]);
    accessTokenMock = sm.mock().returnWith('fakeAccessToken');
    folderSourceNameMock = sm.mock().returnWith('fakeSource');
    proceedToExportMock = sm.mock();
    listAllDocumentsMock = sm.mock().resolveWith([tv.DOCUMENT_PROPS, tv.DOCUMENT_PROPS_VARIANT]);
    promiseMkdirMock = sm.mock(fs.promises, "mkdir").resolveWith('');
    savedExportDestinationMock = sm.mock().returnWith('/fakeExportDestination');
    exportFolderNameMock = sm.mock().returnWith('fake-export-folder');
    metadataExportSkippedMock = sm.mock().returnWith(false);
    duplicatedFilePathCountMock = sm.mock().returnWith({});
    resetDataExportStartMock = sm.mock();
    showOpenDialogMock = sm.mock(remote.dialog, "showOpenDialog").resolveWith({canceled: false, filePaths: ['fakePath']});
    getDocDirAbsolutePathMock = sm.mock().returnWith('/fake/absolute/path');
    getDocAbsolutePathMock = sm.mock().returnWith('/fake/absolute/path/Document title.pdf');
    downloadDocumentAndCheckIntegrityMock = sm.mock().resolveWith('');
    displayExportErrorPromptMock = sm.mock();
    displayExportErrorReportMock = sm.mock();
    notifyExportEndMock = sm.mock();
    hashFileMock = sm.mock().resolveWith('fakeMd5');
    hashStringMock = sm.mock().resolveWith('fakeMd5');
    promiseWriteFileMock = sm.mock(fs.promises, "writeFile").resolveWith('');
    mkdirSyncMock = sm.mock(fs, "mkdirSync");
    createWriteStreamMock = sm.mock(fs, "createWriteStream").returnWith(new PassThrough());
    createWriteStreamMock = sm.mock(fastCsv, "format").returnWith(new PassThrough());
    showMessageBoxMock = sm.mock(remote.dialog, "showMessageBox").resolveWith('');
    htmlReportSaveMock = sm.mock().returnWith('fakeReportPath');
    htmlReportConstructorMock = sm.mock(reportTools, 'HtmlReport').returnWith({save: htmlReportSaveMock});

    storeConfigCopy = cloneDeep(storeConfig);
    storeConfigCopy.modules.export.mutations.SET_EXPORT_DESTINATION = setExportDestinationMock;
    storeConfigCopy.modules.export.mutations.SET_EXPORT_FOLDER_NAME = setExportFolderNameMock;
    storeConfigCopy.modules.export.mutations.SKIP_METADATA_EXPORT = skipMetadataExportMock;
    storeConfigCopy.modules.export.mutations.SET_DOCS_TO_EXPORT = setDocsToExportMock;
    storeConfigCopy.modules.export.mutations.SET_DUPLICATED_FILE_PATH_COUNT = setDuplicatedFilePathCountMock;
    storeConfigCopy.modules.export.mutations.MOVE_DOCS_FROM_ERROR_TO_EXPORT = moveDocsFromErrorToExportMock;
    storeConfigCopy.modules.tools.actions.hashFile = hashFileMock;
    storeConfigCopy.modules.tools.actions.hashString = hashStringMock;
    store = new Vuex.Store(storeConfigCopy);

    wrapper = shallowMount(ExportTab, {
      localVue,
      store,
      propsData: {
        exportInterrupted: false
      },
      computed: {
        docsToExport: {
          cache: false,
          get: docsToExportMock
        },
        savedExportSource: {
          cache: false,
          get: savedExportSourceMock
        },
        exportDocsInError: {
          cache: false,
          get: exportDocsInErrorMock
        },
        accessToken: {
          cache: false,
          get: accessTokenMock
        },
        folderSourceName: folderSourceNameMock,
        savedExportDestination: {
          cache: false,
          get: savedExportDestinationMock
        },
        exportFolderName: {
          cache: false,
          get: exportFolderNameMock
        },
        duplicatedFilePathCount: {
          cache: false,
          get: duplicatedFilePathCountMock
        },
        metadataExportSkipped: {
          cache: false,
          get: metadataExportSkippedMock
        },
      },
      methods: {
        resetDataExportStart: resetDataExportStartMock,
        proceedToExport: proceedToExportMock,
        listAllDocuments: listAllDocumentsMock,
        getDocDirAbsolutePath: getDocDirAbsolutePathMock,
        getDocAbsolutePath: getDocAbsolutePathMock,
        downloadAndIntegrityCheckDocument: downloadDocumentAndCheckIntegrityMock,
        displayExportErrorPrompt: displayExportErrorPromptMock,
        displayExportErrorReport: displayExportErrorReportMock,
        notifyExportEnd: notifyExportEndMock
      }
    });
  });

  afterEach(() => {
    sm.restore();
    listAllDocumentsMock.reset();
    listAllDocumentsMock.actions = [];
    listDocumentsApiMock.reset();
    listDocumentsApiMock.actions = [];
    resetDataExportStartMock.reset();
    showOpenDialogMock.reset();
    showOpenDialogMock.ations = [];
    setExportDestinationMock.reset();
    promiseWriteFileMock.actions = [];
    downloadDocumentAsArrayBufferMock.reset();
    duplicatedFilePathCountMock.actions = [];
    duplicatedFilePathCountMock.reset();
  });

  it("setDestinationFolder call electron showOpenDialog", async () => {
    wrapper.vm.setDestinationFolder(tv.DOCUMENT_PROPS_WITH_FOLDER_PATH);

    await flushPromises();

    // then
    expect(showOpenDialogMock.callCount).to.eql(1);
    // export destination is set
    expect(setExportDestinationMock.callCount).to.eql(1);
    expect(setExportDestinationMock.lastCall.args[1]).to.equal('fakePath');
  });

  it("setDestinationFolder does not store destination if user cancel showOpenDialog", () => {
    // given user cancel dialog
    showOpenDialogMock.actions = [];
    showOpenDialogMock.resolveWith({canceled: true});

    wrapper.vm.setDestinationFolder(tv.DOCUMENT_PROPS_WITH_FOLDER_PATH);

    // then
    expect(showOpenDialogMock.callCount).to.eql(1);
    // export destination is NOT set
    expect(setExportDestinationMock.callCount).to.eql(0);
  });

  it("proceedToExport call methods properly", async () => {
    // restore original method to test it
    wrapper.setMethods({ proceedToExport: ExportTab.methods.proceedToExport });

    await wrapper.vm.proceedToExport();

    // then
    expect(listAllDocumentsMock.callCount).to.eql(1);
    // Documents are committed to store properly
    expect(setDocsToExportMock.callCount).to.eql(1);
    expect(setDocsToExportMock.lastCall.args[1]).to.eql([
      {
        pid: tv.DOCUMENT_PROPS.pid,
        title: tv.DOCUMENT_PROPS.title,
        note: tv.DOCUMENT_PROPS.note,
        created: tv.DOCUMENT_PROPS.created,
        path: tv.DOCUMENT_PROPS.path,
        md5: tv.DOCUMENT_PROPS.md5,
        ext: tv.DOCUMENT_PROPS.ext
      },
      {
        pid: tv.DOCUMENT_PROPS_VARIANT.pid,
        title: tv.DOCUMENT_PROPS_VARIANT.title,
        note: tv.DOCUMENT_PROPS_VARIANT.note,
        created: tv.DOCUMENT_PROPS_VARIANT.created,
        path: tv.DOCUMENT_PROPS_VARIANT.path,
        md5: tv.DOCUMENT_PROPS_VARIANT.md5,
        ext: tv.DOCUMENT_PROPS_VARIANT.ext
      }
    ]);
  }); //TODO complete

  it("listAllDocuments call API properly and emit proper events", async () => {
    const testedEvent = 'event-exporting';

    // restore original method to test it
    wrapper.setMethods({ listAllDocuments: ExportTab.methods.listAllDocuments });
    // given API return only one page of document
    listDocumentsApiMock.resolveWith({data: { results: [tv.DOCUMENT_PROPS, tv.DOCUMENT_PROPS_VARIANT], count: 2, next: null}});

    let testedResult = await wrapper.vm.listAllDocuments();

    // then
    expect(listDocumentsApiMock.callCount).to.eql(1);
    expect(listDocumentsApiMock.lastCall.args).to.eql(['fakeAccessToken', 1]);
    expect(testedResult).to.eql([tv.DOCUMENT_PROPS, tv.DOCUMENT_PROPS_VARIANT]);
    expect(wrapper.emitted(testedEvent)).to.not.be.undefined;
    expect(wrapper.emitted(testedEvent).length).to.equal(1);
    expect(wrapper.emitted(testedEvent)[0]).to.be.eql([{
      "currentCount": 0,
      "totalCount": 2
    }]);

    // given API return 3 pages of documents
    listDocumentsApiMock.reset();
    listDocumentsApiMock.actions = [];
    listDocumentsApiMock.resolveWith({data: { results: [tv.DOCUMENT_PROPS, tv.DOCUMENT_PROPS_VARIANT], count: 6, next: 'fakeUrl'}});
    listDocumentsApiMock.resolveWith({data: { results: [tv.DOCUMENT_PROPS, tv.DOCUMENT_PROPS_VARIANT], count: 6, next: 'fakeUrl'}});
    listDocumentsApiMock.resolveWith({data: { results: [tv.DOCUMENT_PROPS, tv.DOCUMENT_PROPS_VARIANT], count: 6, next: null}});

    testedResult = await wrapper.vm.listAllDocuments();

    // then
    expect(listDocumentsApiMock.callCount).to.eql(3);
    expect(listDocumentsApiMock.calls[0].args).to.eql(['fakeAccessToken', 1]);
    expect(listDocumentsApiMock.calls[1].args).to.eql(['fakeAccessToken', 2]);
    expect(listDocumentsApiMock.calls[2].args).to.eql(['fakeAccessToken', 3]);
    // it return the merged results of the 3 api calls
    expect(testedResult).to.eql([
      tv.DOCUMENT_PROPS, tv.DOCUMENT_PROPS_VARIANT,
      tv.DOCUMENT_PROPS, tv.DOCUMENT_PROPS_VARIANT,
      tv.DOCUMENT_PROPS,  tv.DOCUMENT_PROPS_VARIANT
    ]);
    expect(wrapper.emitted(testedEvent).length).to.equal(4); // 1 + 3 pages
    expect(wrapper.emitted(testedEvent)[1]).to.be.eql([{
      "currentCount": 0,
      "totalCount": 6
    }]);
    expect(wrapper.emitted(testedEvent)[2]).to.be.eql([{
      "currentCount": 2,
      "totalCount": 6
    }]);
    expect(wrapper.emitted(testedEvent)[3]).to.be.eql([{
      "currentCount": 4,
      "totalCount": 6
    }]);
  });

  it("listAllDocuments handle API error", async () => {
    // restore original method to test it
    wrapper.setMethods({ listAllDocuments: ExportTab.methods.listAllDocuments });
    // given an error occurred during first listDocuments API call
    listDocumentsApiMock.actions = [];
    listDocumentsApiMock.rejectWith('Boom!');

    let testedResult;
    await await wrapper.vm.listAllDocuments().catch(error => testedResult = error);

    // then
    expect(listDocumentsApiMock.callCount).to.eql(1);
    // Documents are committed to store properly
    expect(testedResult).to.includes('Boom!');

    // given an error occurred during second listDocuments API call
    testedResult = '';
    listDocumentsApiMock.actions = [];
    listDocumentsApiMock.resolveWith({data: { results: [tv.DOCUMENT_PROPS, tv.DOCUMENT_PROPS_VARIANT], next: 'fakeUrl'}});
    listDocumentsApiMock.rejectWith('Boom!');

    await await wrapper.vm.listAllDocuments().catch(error => testedResult = error);

    // then
    expect(listDocumentsApiMock.callCount).to.eql(2);
    // Documents are committed to store properly
    expect(testedResult).to.includes('Boom!');
  });

  it("getDocDirAbsolutePath return proper value", () => {
    // restore original method to test it
    wrapper.setMethods({ getDocDirAbsolutePath: ExportTab.methods.getDocDirAbsolutePath });

    const testedResult = wrapper.vm.getDocDirAbsolutePath(tv.DOCUMENT_PROPS_WITH_FOLDER_PATH.path);

    // then
    expect(testedResult).to.equal('/fakeExportDestination/fake-export-folder/Folder 1/Folder 2/Folder 3');
  });

  it("getDocAbsolutePath return proper value", () => {
    // restore original method to test it
    wrapper.setMethods({ getDocAbsolutePath: ExportTab.methods.getDocAbsolutePath });
    const docDirAbsolutePath = '/fakeExportDestination/fake-export-date/Folder 1/Folder 2/Folder 3';

    // when fileNameCount isn't set
    let testedResult = wrapper.vm.getDocAbsolutePath(
      docDirAbsolutePath,
      tv.DOCUMENT_PROPS_WITH_FOLDER_PATH.title,
      tv.DOCUMENT_PROPS_WITH_FOLDER_PATH.ext,
    );

    // then
    expect(testedResult).to.equal(
      '/fakeExportDestination/fake-export-date/Folder 1/Folder 2/Folder 3/Document title.pdf'
    );

    // when fileNameCount is set
    testedResult = wrapper.vm.getDocAbsolutePath(
      docDirAbsolutePath,
      tv.DOCUMENT_PROPS_WITH_FOLDER_PATH.title,
      tv.DOCUMENT_PROPS_WITH_FOLDER_PATH.ext,
      1
    );

    // then
    expect(testedResult).to.equal(
      '/fakeExportDestination/fake-export-date/Folder 1/Folder 2/Folder 3/Document title (1).pdf'
    );
  });

  it("downloadAndIntegrityCheckDocument resolve proper value", async () => {
    // restore original method to test it
    wrapper.setMethods({ downloadAndIntegrityCheckDocument: ExportTab.methods.downloadAndIntegrityCheckDocument });
    const dirAbsolutePath = '/fake/absolute/path';

    // then
    let testedValue;
    await wrapper.vm.downloadAndIntegrityCheckDocument(tv.DOCUMENT_PROPS, dirAbsolutePath)
      .then(absolutePath => {testedValue = absolutePath});

    // then
    expect(testedValue).to.eql('/fake/absolute/path/Document title.pdf');
  });

  it("downloadAndIntegrityCheckDocument call getDocAbsolutePath", async () => {
    // restore original method to test it
    wrapper.setMethods({ downloadAndIntegrityCheckDocument: ExportTab.methods.downloadAndIntegrityCheckDocument });
    const dirAbsolutePath = '/fake/absolute/path';

    // then
    await wrapper.vm.downloadAndIntegrityCheckDocument(tv.DOCUMENT_PROPS, dirAbsolutePath);

    // then
    expect(getDocAbsolutePathMock.callCount).to.eql(1);
    expect(getDocAbsolutePathMock.lastCall.args).to.eql([dirAbsolutePath, tv.DOCUMENT_PROPS.title, tv.DOCUMENT_PROPS.ext]);
  });

  it("downloadAndIntegrityCheckDocument call API properly", async () => {
    // restore original method to test it
    wrapper.setMethods({ downloadAndIntegrityCheckDocument: ExportTab.methods.downloadAndIntegrityCheckDocument });

    await wrapper.vm.downloadAndIntegrityCheckDocument(tv.DOCUMENT_PROPS, '/fake/absolute/path');

    // then
    expect(downloadDocumentAsArrayBufferMock.callCount).to.eql(1);
    expect(downloadDocumentAsArrayBufferMock.lastCall.args).to.eql(['fakeAccessToken', tv.DOCUMENT_PROPS.pid]);
  });

  it("downloadAndIntegrityCheckDocument call hashFile properly to make integrity check", async () => {
    // restore original method to test it
    wrapper.setMethods({ downloadAndIntegrityCheckDocument: ExportTab.methods.downloadAndIntegrityCheckDocument });
    // given computed md5 match expected md5
    hashFileMock.actions =[];
    hashFileMock.resolveWith(tv.DOCUMENT_PROPS.md5);

    await wrapper.vm.downloadAndIntegrityCheckDocument(tv.DOCUMENT_PROPS, '/fake/absolute/path');

    // then file is save to the disk
    expect(hashFileMock.callCount).to.eql(1);
    expect(hashFileMock.lastCall.args[1]).to.eql({algorithm: 'md5', file: Buffer.from(arrayBufferMock)});
    expect(promiseWriteFileMock.callCount).to.eql(1);

    // given computed md5 does not match expected md5
    hashFileMock.actions =[];
    hashFileMock.resolveWith('boom!');
    promiseWriteFileMock.reset();

    let testedResult;
    await wrapper.vm.downloadAndIntegrityCheckDocument(tv.DOCUMENT_PROPS, '/fake/absolute/path').catch(error => {
      testedResult = error
    });

    // then file is not save to the disk
    expect(promiseWriteFileMock.callCount).to.eql(0);
    expect(testedResult).to.includes('md5 mismatch');
  });

  it("downloadAndIntegrityCheckDocument call writeFile", async () => {
    // restore original method to test it
    wrapper.setMethods({ downloadAndIntegrityCheckDocument: ExportTab.methods.downloadAndIntegrityCheckDocument });

    await wrapper.vm.downloadAndIntegrityCheckDocument(tv.DOCUMENT_PROPS, '/fake/absolute/path');

    // then
    expect(promiseWriteFileMock.callCount).to.eql(1);
    expect(promiseWriteFileMock.lastCall.args).to.eql([
      '/fake/absolute/path/Document title.pdf',
      Buffer.from(arrayBufferMock),
      {flag: 'wx'}
    ]);
  });

  it("downloadAndIntegrityCheckDocument handle writeFile errors", async () => {
    // restore original method to test it
    wrapper.setMethods({ downloadAndIntegrityCheckDocument: ExportTab.methods.downloadAndIntegrityCheckDocument });
    // given writeFile return a file already exist error
    promiseWriteFileMock.actions = [];
    promiseWriteFileMock.rejectWith({code: 'EEXIST'});
    promiseWriteFileMock.resolveWith('');
    getDocAbsolutePathMock.actions = [];
    getDocAbsolutePathMock.returnWith('/fake/absolute/path/Document title.pdf');
    getDocAbsolutePathMock.returnWith('/fake/absolute/path/Document title (1).pdf');

    await wrapper.vm.downloadAndIntegrityCheckDocument(tv.DOCUMENT_PROPS, '/fake/absolute/path');

    // then write file and getDocAbsolutePath are called a second time to add a count to the file name
    expect(promiseWriteFileMock.callCount).to.eql(2);
    expect(promiseWriteFileMock.lastCall.args).to.eql([
      '/fake/absolute/path/Document title (1).pdf',
      Buffer.from(arrayBufferMock),
      {flag: 'wx'}
    ]);
    expect(getDocAbsolutePathMock.callCount).to.eql(2);
    expect(setDuplicatedFilePathCountMock.lastCall.args[1]).to.eql(['fakeMd5', 1]);
    expect(getDocAbsolutePathMock.lastCall.args).to.eql([
      '/fake/absolute/path',
      tv.DOCUMENT_PROPS.title,
      tv.DOCUMENT_PROPS.ext,
      1
    ]);

    // if download the same document again the count is incremented
    duplicatedFilePathCountMock.actions = [];
    duplicatedFilePathCountMock.returnWith({'fakeMd5': 1});
    await wrapper.vm.downloadAndIntegrityCheckDocument(tv.DOCUMENT_PROPS, '/fake/absolute/path');
    expect(getDocAbsolutePathMock.lastCall.args).to.eql([
      '/fake/absolute/path',
      tv.DOCUMENT_PROPS.title,
      tv.DOCUMENT_PROPS.ext,
      2
    ]);

    // given writeFile return a unknown error
    promiseWriteFileMock.actions = [];
    promiseWriteFileMock.reset();
    promiseWriteFileMock.rejectWith({code: 'boom!'});

    let testedResult;
    await wrapper.vm.downloadAndIntegrityCheckDocument(tv.DOCUMENT_PROPS, '/fake/absolute/path').catch(error => {
      testedResult = error
    });

    // then error is returned
    expect(promiseWriteFileMock.callCount).to.eql(1);
    expect(testedResult.code).to.eql('boom!');
  });

  it("displayExportErrorPrompt call remote.dialog.showMessageBox", async () => {
    // restore original method to test it
    wrapper.setMethods({ displayExportErrorPrompt: ExportTab.methods.displayExportErrorPrompt });

    await wrapper.vm.displayExportErrorPrompt();

    // api is call to list folders inside parent
    expect(showMessageBoxMock.callCount).to.be.equal(1);
    expect(showMessageBoxMock.lastCall.args[1]).to.includes({type: 'error'});
  });

  it("displayExportErrorPrompt call displayExportErrorReport if needed and commit MOVE_DOCS_FROM_ERROR_TO_EXPORT to store",  async () => {
    // restore original method to test it
    wrapper.setMethods({ displayExportErrorPrompt: ExportTab.methods.displayExportErrorPrompt });
    showMessageBoxMock.actions = [];
    showMessageBoxMock.resolveWith({response: 1}); // confirmation button clicked on the message box

    await wrapper.vm.displayExportErrorPrompt();

    // api is call to list folders inside parent
    expect(displayExportErrorReportMock.callCount).to.be.equal(1);
    expect(moveDocsFromErrorToExportMock.callCount).to.be.equal(1);
  });

  it("notifyExportEnd call displayExportErrorReport or electron showMessageBox if needed",  () => {
    // restore original method to test it
    wrapper.setMethods({ notifyExportEnd: ExportTab.methods.notifyExportEnd });

    // if has been disconnected during import
    accessTokenMock.actions = [];
    accessTokenMock.returnWith('');

    wrapper.vm.notifyExportEnd();

    // a message indicate user that import have been interrupted and can be resumed
    expect(displayExportErrorPromptMock.callCount).to.be.equal(0);
    expect(showMessageBoxMock.callCount).to.be.equal(1);
    expect(showMessageBoxMock.lastCall.args[1]).to.includes({type: 'error'});

    showMessageBoxMock.reset();

    // when user is still logged and there is no error
    accessTokenMock.actions = [];
    accessTokenMock.returnWith('fakeAccessToken');
    exportDocsInErrorMock.actions = [];
    exportDocsInErrorMock.returnWith([]);

    wrapper.vm.notifyExportEnd();

    // success message is displayed
    expect(displayExportErrorPromptMock.callCount).to.be.equal(0);
    expect(showMessageBoxMock.callCount).to.be.equal(1);
    expect(showMessageBoxMock.lastCall.args[1]).to.includes({type: 'info'});

    showMessageBoxMock.reset();

    // when user is still logged and there is at least one error
    accessTokenMock.actions = [];
    accessTokenMock.returnWith('fakeAccessToken');
    exportDocsInErrorMock.actions = [];
    exportDocsInErrorMock.returnWith(['doc1']);

    wrapper.vm.notifyExportEnd();

    // success message is displayed
    expect(displayExportErrorPromptMock.callCount).to.be.equal(1);
    expect(displayExportErrorPromptMock.lastCall.args[0]).to.equal(1); // exportDocsInError length
    expect(showMessageBoxMock.callCount).to.be.equal(0);

    showMessageBoxMock.reset();
  });

  it("displayExportErrorReport instantiate Html report, save it and open it", async () => {
    // restore original method to test it
    wrapper.setMethods({ displayExportErrorReport: ExportTab.methods.displayExportErrorReport });
    exportDocsInErrorMock.actions = [];
    exportDocsInErrorMock.returnWith([
      {
        title: tv.DOCUMENT_PROPS.title,
        pid: tv.DOCUMENT_PROPS.pid,
        reason: 'boom',
      },
      {
        title: tv.DOCUMENT_PROPS_VARIANT.title,
        pid: tv.DOCUMENT_PROPS_VARIANT.pid,
        reason: 'kaBoom',
      },
    ]);

    wrapper.vm.displayExportErrorReport();

    // File object and md5 of file is returned
    expect(htmlReportConstructorMock.callCount).to.be.equal(1);
    expect(htmlReportConstructorMock.lastCall.args[1]).to.be.eql([
      [`<a href="https://papermatter.app/app/#/home?doc=${tv.DOCUMENT_PROPS.pid}" target="_blank">${tv.DOCUMENT_PROPS.title}</a>`, 'boom'],
      [`<a href="https://papermatter.app/app/#/home?doc=${tv.DOCUMENT_PROPS_VARIANT.pid}" target="_blank">${tv.DOCUMENT_PROPS_VARIANT.title}</a>`, 'kaBoom'],
    ]);
    expect(htmlReportSaveMock.callCount).to.be.equal(1);
    expect(openExternalMock.callCount).to.be.equal(1);
    expect(openExternalMock.lastCall.arg).to.be.equal('file:///fakeReportPath');
  });
});
