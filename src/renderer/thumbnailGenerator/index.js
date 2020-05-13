/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import pdfjsLib from 'pdfjs-dist/webpack'

window.URL = window.URL || window.webkitURL;

export const thumbnailGenerator = {
  createThumbFromFile : function (file) {
    try {
      let objectURL = window.URL.createObjectURL(file);
      return Promise.resolve(this.createThumbFromUrl(objectURL));
    }
    catch(error) {
      return Promise.reject(error);
    }
  },
  createThumbFromUrl : function (url) {
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
      const context = canvas.getContext('2d');

      let viewport = page.getViewport({scale: 0.5});

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      let render = page.render({
        canvasContext: context,
        viewport: viewport
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
    })
  }
};
