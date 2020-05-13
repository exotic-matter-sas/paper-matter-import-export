/*
 * Copyright (c) 2020 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Mocked Vue props

export const USER_PROPS = {
  email: "user1@example.com",
  password: "p@ssw0rd"
};

export const FILES_PROPS = {
  name: 'test.pdf',
  path: 'absolute/path/test.pdf',
  webkitRelativePath: 'relative/path/test.pdf',
  type: 'application/pdf',
  lastModified: 1567521895187,
};

export const FILES_PROPS_VARIANT = {
  name: 'test2.pdf',
  path: 'absolute/path/test2.pdf',
  webkitRelativePath: 'relative/path/test2.pdf',
  type: 'application/pdf',
  lastModified: 1567521895188,
};

export const FILES_PROPS_TYPE_KO = {
  name: 'test.avi',
  path: 'absolute/path/test.avi',
  webkitRelativePath: 'relative/path/test.avi',
  type: 'video/avi',
  lastModified: 1567521895189,
};

export const FILES_PROPS_NO_RELATIVE_PATH = {
  name: 'test3.pdf',
  path: 'absolute/path/test3.pdf',
  webkitRelativePath: '',
  type: 'application/pdf',
  lastModified: 1567521895190,
};

export const FOLDER_PROPS = {
  id: 1234,
  name: "Folder title",
  created: new Date("2019-04-18T10:59:00").toString(),
  parent: null,
};

export const FOLDER_PROPS_VARIANT = {
  id: 5678,
  name: "Folder title 2",
  parent: null,
};

export const FOLDER_PROPS_WITH_PARENT = {
  id: 1234,
  name: "Folder title",
  parent: "4321",
};

export const FOLDER_TREE_ITEM = {
  id: 1234,
  name: "Folder title",
  created: new Date("2019-04-18T10:59:00").toString(),
  has_descendant: false,
};

export const FOLDER_TREE_ITEM_WITH_DESCENDANT = {
  id: 1234,
  name: "Folder title",
  created: new Date("2019-04-18T10:59:00").toString(),
  has_descendant: true,
};

export const DOCUMENT_PROPS = {
  pid: "1000",
  title: "Document title",
  note: "Document note",
  created: new Date("2019-04-18T10:59:00").toString(),
  thumbnail_available: true,
  ftl_folder: null,
  path: [],
};

export const DOCUMENT_PROPS_VARIANT = {
  pid: "1001",
  title: "Document title 2",
  note: "Document note 2",
  created: new Date("2019-04-18T11:00:00").toString(),
  thumbnail_available: true,
  ftl_folder: null,
  path: [],
};

export const DOCUMENT_PROPS_WITH_FOLDER = {
  pid: "2000",
  title: "Document title",
  note: "Document note",
  created: new Date("2019-04-18T10:59:00").toString(),
  thumbnail_available: true,
  ftl_folder: 123,
  path: [],
};

export const DOCUMENT_PROPS_WITH_FOLDER_MOVED = {
  ftl_folder: 321,
  ...DOCUMENT_PROPS_WITH_FOLDER,
};

export const DOCUMENT_NO_THUMB_PROPS = {
  pid: "3000",
  title: "Document title",
  note: "Document note",
  created: new Date("2019-04-18T10:59:00").toString(),
  thumbnail_available: false,
  path: [],
  type: "application/pdf",
};

export const DOCUMENT_NO_THUMB_PROPS_2 = {
  pid: "3001",
  title: "Document title 2",
  note: "Document note 2",
  created: new Date("2019-04-18T10:59:00").toString(),
  thumbnail_available: false,
  path: [],
  type: "application/pdf",
};
