/*
 * Copyright (c) 2019 Exotic Matter SAS. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import axios from "axios";

export default class ApiClient {
  constructor({hostName, clientId, redirectUri}) {
    this.http = axios.create({baseURL: hostName});
    this.clientId = clientId;
    this.redirectUri = redirectUri;
  }

  updateServerData(hostName, clientId){
    this.http.defaults.baseURL = hostName;
    this.clientId = clientId;
  }

  /*
   * Oauth2 requests
   * For theses request we use "Content-Type: application/x-www-form-urlencoded" for POST data
   * As Oauth2 flow doesn't expect JSON data
   */

  getAccessToken(code){
    const data = new URLSearchParams();
    data.append('client_id', this.clientId);
    data.append('code', code);
    data.append('redirect_uri', this.redirectUri);
    data.append('grant_type', 'authorization_code');
    return this.http.post(
      '/oauth2/token',
      data
    )
  }

  refreshAccessToken(refreshToken){
    // For this request we use "Content-Type: application/x-www-form-urlencoded" for POST data
    // As Oauth2 flow doesn't expect JSON formatted data
    const data = new URLSearchParams();
    data.append('client_id', this.clientId);
    data.append('refresh_token', refreshToken);
    data.append('grant_type', 'refresh_token');
    return this.http.post(
      '/oauth2/token',
      data
    )
  }

  revokeToken(token, token_type_hint="access_token"){
    // For this request we use "Content-Type: application/x-www-form-urlencoded" for POST data
    // As Oauth2 flow doesn't expect JSON formatted data
    const data = new URLSearchParams();
    data.append('client_id', this.clientId);
    data.append('token', token);
    data.append('token_type_hint', token_type_hint);
    return this.http.post(
      '/oauth2/revoke_token',
      data
    )
  }

  /*
   * API REST requests
   */

  getUserData(accessToken) {
    return this.http.get(
      `/app/api/v1/users/me`,
      {headers: {'Authorization': "Bearer " + accessToken}}
    )
  }

  createFolder(accessToken, name, parent=null){
    return this.http.post(
      '/app/api/v1/folders',
      {name, parent},
      {headers: {'Authorization': "Bearer " + accessToken}}
    )
  }

  listFolders(accessToken, parent=null){
    let queryString = parent !== null ? `?level=${parent}` : '';

    return this.http.get(
      `/app/api/v1/folders${queryString}`,
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
      '/app/api/v1/documents/upload',
      formData,
      {headers: {'Authorization': "Bearer " + accessToken}}
    )
  }

  listDocuments(accessToken, page=1, level=null){
    let queryString = level ? `&level=${level}` : '';
    queryString += page > 1 ? `&page=${page}` : '';

    return this.http.get(
      `/app/api/v1/documents?flat${queryString}`,
      {headers: {'Authorization': "Bearer " + accessToken}}
    )
  }

  downloadDocumentAsArrayBuffer(accessToken, docUrl){
    return this.http.get(
      docUrl,
      {
        headers: {'Authorization': "Bearer " + accessToken},
        responseType: 'arraybuffer'
      }
    )
  }

}

