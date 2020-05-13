/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */
import fs from "fs";
import path from "path";
import sm from "simple-mock";
import log from "electron-log"

import {reportTools} from "../../../src/renderer/htmlReport";
import {remote} from "electron";

describe("HtmlReport constructor", () => {
  // define all var needed for the test here
  let htmlReport;
  let renderMock;
  let fakeColumnsTitles;
  let fakeRows;
  let startDate;
  let endDate;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    startDate = new Date();
    fakeColumnsTitles = ['col1', 'col2'];
    fakeRows = [['line1_cel1', 'line1_cel2'], ['line2_cel1', 'line2_cel2']];
    renderMock = sm.mock(reportTools.HtmlReport.prototype, "render").returnWith('');

    htmlReport = new reportTools.HtmlReport(fakeColumnsTitles, fakeRows)
  });

  afterEach(() => {
    sm.restore();
  });

  it("constructor set data properly", () => {
    endDate = new Date();

    // reportDate should be a date instantiated after startDate and before endDate
    expect(htmlReport.reportDate).to.be.an.instanceof(Date);
    expect(htmlReport.reportDate).to.be.within(startDate, endDate);

    expect(htmlReport.columnsTitles).to.be.equal(fakeColumnsTitles);
    expect(htmlReport.rows).to.be.equal(fakeRows);
    expect(htmlReport.htmlReport).to.be.equal('');
  });

  it("constructor call render method", () => {
    expect(renderMock.callCount).to.be.equal(1);
  });
});

describe("HtmlReport methods", () => {
  // define all var needed for the test here
  let htmlReport;
  let renderMock;
  let fakeColumnsTitles;
  let fakeRows;
  let writeFileSyncMock;
  let joinMock;
  let getPathMock;

  beforeEach(() => {
    // set vars here: vue wrapper args, fake values, mock
    fakeColumnsTitles = ['col1', 'col2'];
    fakeRows = [['line1_cel1', 'line1_cel2'], ['line2_cel1', 'line2_cel2']];
    renderMock = sm.mock(reportTools.HtmlReport.prototype, "render").returnWith('');
    writeFileSyncMock = sm.mock(fs, "writeFileSync").returnWith('');
    joinMock = sm.mock(path, "join").returnWith('fakeFilePath');
    getPathMock = sm.mock(remote.app, "getPath").returnWith('');
    getPathMock = sm.mock(log, "debug").returnWith('');

    htmlReport = new reportTools.HtmlReport(fakeColumnsTitles, fakeRows);
    renderMock = sm.mock(reportTools.HtmlReport.prototype, "reportDate").returnWith('');

    htmlReport.reportDate = {
      toLocaleTimeString: sm.mock().returnWith('fakeReportDate'),
      toISOString: sm.mock().returnWith('fake:report:date')
    };
  });

  afterEach(() => {
    sm.restore();
    renderMock.actions = [];
  });

  it("render generate proper html report", () => {
    // restore original method to test it
    htmlReport.render.callOriginal();

    htmlReport.render();

    expect(htmlReport.htmlReport).to.be.equal('<!DOCTYPE html><html lang=\"en\"><head><title>Error report fakeReportDate</title><meta charset=\"utf-8\"><style>body{background: #f8f9fa} thead{font-weight: bold} td{padding-right: 10px}</style></head><body><table><thead><th><tr><td>col1</td><td>col2</td></tr></th></thead><tbody><tr><td>line1_cel1</td><td>line1_cel2</td></tr><tr><td>line2_cel1</td><td>line2_cel2</td></tr></tbody></table></body></html>');
  });

  it("save call writeFileSync and return file path", () => {
    // given
    htmlReport.htmlReport = 'fakeHtmlReport';
    writeFileSyncMock.reset();

    let testValue = htmlReport.save();

    expect(writeFileSyncMock.callCount).to.be.equal(1);
    expect(joinMock.lastCall.args[1]).to.be.eql('error_report_fake-report-date.html'); // : are replaced by -
    expect(writeFileSyncMock.lastCall.args[0]).to.be.eql('fakeFilePath');
    expect(writeFileSyncMock.lastCall.args[1]).to.be.eql('fakeHtmlReport');
    expect(testValue).to.be.eql('fakeFilePath');
  });
});
