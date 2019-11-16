import {remote} from "electron";

const fs = require('fs');
const path = require('path');
const log = require('electron-log');

export default class HtmlReport {
  constructor(columnsTitles, rows) {
    this.reportDate = new Date();
    this.columnsTitles = columnsTitles;
    this.rows = rows;
    this.htmlReport = '';

    this.render();
  }

  render() {
    log.debug('start rendering html report');
    const tableHeader = `<tr>${this.columnsTitles.map(title => "<td>" + title + "</td>").join('')}</tr>`;

    let tableRows = '';
    for (const row of this.rows) {
      tableRows += `<tr>${row.map(cellValue => "<td>" + cellValue + "</td>").join('')}</tr>`;
    }

    const table = `<table><thead><th>${tableHeader}</th></thead><tbody>${tableRows}</tbody></table>`;

    this.htmlReport = `<!DOCTYPE html><html lang="en"><head><title>Error report ${this.reportDate.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'})}</title><meta charset="utf-8"></head><body>${table}</body></html>`;
    log.debug('html report rendered');
  }

  save() {
    log.debug('saving report to disk');
    const fileName = `error_report_${this.reportDate.toISOString()}.html`;
    const filePath = path.join(remote.app.getPath('userData'), fileName);

    fs.writeFileSync(filePath, this.htmlReport);
    log.debug('error report save in: ' + filePath);
    return filePath;
  }
}

