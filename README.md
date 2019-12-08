# paper-matter-import-export

> Local client to import/export your documents in/from Paper Matter

#### Build Setup

    # install dependencies
    npm install
    
    # serve with hot reload at localhost:9080
    npm run dev
    
    # build electron application for production
    npm run build


#### Debug app run

During dev you can remote debug the app by copying the debugger url which appears in the console at app run.

    # line which appears in console at app run
    Debugger listening on ws://127.0.0.1:5858/0b935d7b-0f11-4c23-92f7-221310dfbaa0
    
    # to attach debugger, open this url in Chrome 
    chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:5858/0b935d7b-0f11-4c23-92f7-221310dfbaa0
    
To debug built app see https://simulatedgreg.gitbooks.io/electron-vue/content/en/debugging-production.html

#### Debug app build

    # Produce simple executable without full installer in /dist.
    npm run build:dir

#### Release process and build on CI

 1. Update package.json `version` (eg. `1.0.0`)
 2. Create a draft release on Github
   * tag should be on master and named with `version` prefixed with a `v` (eg. `v1.0.0`)
   * name should be `version` (eg. `1.0.0`)
 3. Publish and tag release on Github 

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[8fae476](https://github.com/SimulatedGREG/electron-vue/tree/8fae4763e9d225d3691b627e83b9e09b56f6c935) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
