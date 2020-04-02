/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import axios from "axios";

export default class ApiCient {
  constructor(hostName) {
    this.http = axios.create({baseURL: hostName + '/app/api'})
  }

  getAccessToken(email, password){
    return this.http.post(
      '/token',
      {email, password}
    )
  }

  refreshAccessToken(refreshToken){
    return this.http.post(
      '/token/refresh',
      {refresh: refreshToken}
    )
  }

  listFolders(accessToken, parent=null){
    let queryString = parent !== null ? `?level=${parent}` : '';
    return this.http.get(
      `/v1/folders${queryString}`,
      {headers: {'Authorization': "Bearer " + accessToken}}
    )
  }

  createFolder(accessToken, name, parent=null){
    return this.http.post(
      '/v1/folders',
      {name, parent},
      {headers: {'Authorization': "Bearer " + accessToken}}
    )
  }

  uploadDocument(accessToken, jsonData, file, thumbnail=null){
    let formData = new FormData();
    formData.append('json', JSON.stringify(jsonData));
    formData.append('file', file);

    if (thumbnail !== null){
      formData.append('thumbnail', thumbnail);
    }

    return this.http.post(
      '/v1/documents/upload',
      formData,
      {headers: {'Authorization': "Bearer " + accessToken}}
    )
  }
}

