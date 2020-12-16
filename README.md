# paper-matter-import-export

> Local client to import/export your documents in/from [Paper Matter App](https://gitlab.com/exotic-matter/ftl-app)

## For users

### Installation

You can download and install client from this page (Windows, Linux, macOS): [https://welcome.papermatter.app/downloads/](https://welcome.papermatter.app/downloads/)

### Logs location

In case you report a bug, it could be useful to join the log files. The easiest way to get them is to display *Advanced* menu by hitting `Alt` key (not needed on macOS) and click on *Open logs folder* item.

If app can't be run, you can also find them by manually opening this folder:

- Linux: ~/.config/paper-matter-import-export/logs/
- macOS: ~/Library/Logs/paper-matter-import-export/
- Windows: %USERPROFILE%\AppData\Roaming\paper-matter-import-export\logs\

## For developers

### Requirements

- Node.js LTS

### Install Node modules

    npm ci

### Run locally

    npm run dev
    
#### Debug local run

Useful logs should appear inside the terminal used to run the app.

You can also remote debug the app by copying the debugger url which appears in the console at app run.

    # line which appears in console at app run
    Debugger listening on ws://127.0.0.1:5858/0b935d7b-0f11-4c23-92f7-221310dfbaa0
    
To attach the debugger in Chrome, open this url:
 - devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=`127.0.0.1:5858/0b935d7b-0f11-4c23-92f7-221310dfbaa0`

_For more infos see https://simulatedgreg.gitbooks.io/electron-vue/content/en/debugging-production.html_

#### Debug update process

_Run all commands from one Terminal for ENV VAR to be preserved (commands are given for Linux)_

1. Create a test repo with a README.md on Github
1. Update `package.json` > `version` to a very high number (e.g. 100.0.0, just make sure it doesn't match an already published release for this repo)
1. Update `package.json` > `build.publish` to use the test repo
1. Set ENV VAR for Github token, it should give access to test repo with `repo` scope: `export GH_TOKEN=XXX`
1. Set ENV VAR to debug electron-builder process and call `checkForUpdates` in dev mode: `export DEBUG=electron-builder`
1. Publish app to a Github draft release: `npm run build`
1. Edit and publish release on Github
1. Restore old value for `package.json` > `version`
1. Copy `dev-app-update.yml` to `dist/electron/dev-app-update.yml` and update values to use test repo
1. (Linux only) Set APPIMAGE ENV VAR: `export APPIMAGE=true`
1. (Mac only) App notarization is needed to test full update process, you have to set `API_KEY_ID` and `API_KEY_ISSUER_ID` (these values can be generated/retrieved from https://appstoreconnect.apple.com/access/api)
1. Run app in dev mode `npm run dev` to test update process partially or build app `npm run build` and run it (from `build/output`) to test full update process

You should see logs related to update process popping in the terminal.

### Run tests

#### Unit tests

_With [Karma](https://karma-runner.github.io/latest/index.html) test runner, [Mocha](https://mochajs.org/) test framework, [Chai](https://www.chaijs.com/) assertion library and [simple-mock](https://github.com/jupiter/simple-mock) mocking library_

    npm run unit

### Release and build process on CI

 1. Update package.json `version` (e.g. `1.0.0`) and push
 1. :warning: Wait for draft release to be created and built app to be attached to it :warning:
 1. Complete and publish/tag release on Github

#### Debug app build locally

    # Produce simple executable without full installer in /build/output.
    npm run build:dir
    # You can run unpackaged app by running executable
    cd build/output/linux-unpacked/
    ./paper-matter-import-export
    # Useful logs may appears in terminal during app execution

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
