import pdfjsLib from 'pdfjs-dist/webpack'

// pdfjsLib.disableWorker = true;
window.URL = window.URL || window.webkitURL;

export const createThumbFromFile = function (file) {
  let objectURL = window.URL.createObjectURL(file);
  return createThumbFromUrl(objectURL);
};

export const createThumbFromUrl = function (url) {
  return new Promise((resolve, reject) => {

    let loadingTask = pdfjsLib.getDocument(url);
    loadingTask.promise.then(function (pdf) {
      pdf.getPage(1).then(function (page) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext('2d');

        let viewport = page.getViewport({scale: 0.5});

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        let render = page.render({
          canvasContext: context,
          viewport: viewport
        });

        render.promise.then(function () {
          resolve(canvas.toDataURL());
        });
      }).catch(function () {
        reject("pdf thumb error: could not open page 1 of document " + url + ". Not a pdf ?");
      });
    }).catch(function () {
      reject("pdf thumb error: could not find or open document " + url + ". Not a pdf ?");
    });
  });
};
