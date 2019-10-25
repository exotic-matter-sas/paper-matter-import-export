import axios from "axios";

export default class Index {
  constructor(baseUrl) {
    this.http = axios.create({baseURL: baseUrl})
  }

  getAccessToken(email, password){
    return this.http.post(
    '/api/token',
    {email: email, password: password}
    )
  }

  refreshAccessToken(refreshToken){
    return this.http.post(
    '/api/token/refresh',
    {refresh: refreshToken}
    )
  }
}

