# paper-matter-import-export

> Local client to import/export your documents in/from [Paper Matter App](https://gitlab.com/exotic-matter/ftl-app)

## For users

### Installation

Please refer to this page to install client on Windows, Linux (deb) (and soon, hopefully, MacOSX) : [https://welcome.papermatter.app/import-export/](https://welcome.papermatter.app/import-export/)

## For developers

### Requirements

- Node.js LTS

### Install Node modules

    npm ci

### Run locally

    npm run dev
    
#### Debug app run

During dev you can remote debug the app by copying the debugger url which appears in the console at app run.

    # line which appears in console at app run
    Debugger listening on ws://127.0.0.1:5858/0b935d7b-0f11-4c23-92f7-221310dfbaa0
    
To attach debugger in Chrome, open this url:
 - devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=`127.0.0.1:5858/0b935d7b-0f11-4c23-92f7-221310dfbaa0`

_For more infos see https://simulatedgreg.gitbooks.io/electron-vue/content/en/debugging-production.html_

### Run tests

#### Unit tests

_With [Karma](https://karma-runner.github.io/latest/index.html) test runner, [Mocha](https://mochajs.org/) test framework, [Chai](https://www.chaijs.com/) assertion library and [simple-mock](https://github.com/jupiter/simple-mock) mocking library_

    npm run unit

### Release and build process on CI

 1. Update package.json `version` (eg. `1.0.0`)
 2. Create a draft release on Github
   * tag should be on master and named with `version` prefixed with a `v` (eg. `v1.0.0`)
   * name should be `version` (eg. `1.0.0`)
 3. Publish and tag release on Github 

#### Debug app build locally

    # Produce simple executable without full installer in /dist.
    npm run build:dir

# Credits

- Programming languages:

  - [Vue.js](https://vuejs.org/)
  - [Node.js](https://nodejs.org)

- Main technologies used:

  - Software framework: 
    - [Electron](https://www.electronjs.org/)
    - [electron-vue](https://github.com/SimulatedGREG/electron-vue)
  - PDF document thumbnail generation: [PDF.js](https://mozilla.github.io/pdf.js/)

- UI:
  - CSS framework :
    - [Sass](https://sass-lang.com/)
    - [Bootstrap](https://getbootstrap.com/)
  - Logo police: [Quicksand](https://github.com/andrew-paglinawan/QuicksandFamily)
  - App Icons: [Font Awesome](https://fontawesome.com/)

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[8fae476](https://github.com/SimulatedGREG/electron-vue/tree/8fae4763e9d225d3691b627e83b9e09b56f6c935) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
