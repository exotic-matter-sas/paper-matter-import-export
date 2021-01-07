/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// import pdfjsLib from "pdfjs-dist/webpack";
// FIXME restore import above when
//  https://github.com/mozilla/pdf.js/issues/12813 fix is available in NPM
// Workaround: pdfjs-dist/webpack does not pass filename option to worker-loader
// so worker-loader tell webpack to generate a entry named pdf.worker.worker.js
// instead of expected pdf.worker.js (as default work-loader filename is
// [name].worker.js)
var pdfjsLib = require("pdfjs-dist/build/pdf.js");
var PdfjsWorker = require("worker-loader?esModule=false&filename=[name].js!pdfjs-dist/build/pdf.worker.js");

if (typeof window !== "undefined" && "Worker" in window) {
  pdfjsLib.GlobalWorkerOptions.workerPort = new PdfjsWorker();
}
// Workaround end here

window.URL = window.URL || window.webkitURL;

export const thumbnailGenerator = {
  createThumbFromFile: function (file) {
    try {
      let objectURL = window.URL.createObjectURL(file);
      return Promise.resolve(this.createThumbFromUrl(objectURL));
    } catch (error) {
      return Promise.reject(error);
    }
  },
  createThumbFromUrl: function (url) {
    let loadingTask = pdfjsLib.getDocument(url);
    let canvas;
    let pdfFile;
    return loadingTask.promise
      .then(function (pdf) {
        pdfFile = pdf;
        return pdf.getPage(1);
      })
      .then(function (page) {
        canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        let viewport = page.getViewport({ scale: 0.5 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        let render = page.render({
          canvasContext: context,
          viewport: viewport,
        });
        return render.promise;
      })
      .then(function () {
        return Promise.resolve(canvas.toDataURL());
      })
      .finally(function () {
        // to limit memory leaks
        if (pdfFile !== undefined) {
          pdfFile.cleanup();
          pdfFile.destroy();
        }
        loadingTask.destroy();

        pdfFile = null;
        loadingTask = null;
        canvas = null;
      });
  },
};
