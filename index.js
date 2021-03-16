'use strict';

const axios = require('axios');

class ShowDocApi {
  constructor({ apiKey, apiToken, itemID, homePage }) {
    if (!apiKey || !apiToken || !itemID) {
      throw new Error('node-showdoc: invaild config. api_key, api_token and itemID required.');
    }
    let url = homePage + '/server/index.php?s=';
    if (!homePage) {
      homePage = 'https://www.showdoc.cc';
      url = 'https://www.showdoc.cc/server';
    }

    this.config = {
      apiKey,
      apiToken,
      itemID,
      homePage,
      url,
      pagePrefix: homePage + '/web/#/' + itemID + '?page_id=',
    };
  }

  async _requestData(api, data) {
    const { apiKey, apiToken, url } = this.config;
    data.api_key = apiKey;
    data.api_token = apiToken;
    const result = await axios.request(url + api, {
      method: 'POST',
      data,
    });
    if (result.status !== 200) {
      throw new Error('showdoc request failed：' + result.status);
    }
    const resData = result.data;
    if (resData.error_code !== 0) {
      throw new Error('showdoc request failed' + resData.error_message + '(' + resData.error_code + ')');
    }

    return resData.data;
  }

  async updateDoc(path, title, content, order) {
    const { pagePrefix } = this.config;
    const reqData = {
      cat_name: path,
      page_title: title,
      page_content: content,
    };
    if (typeof (order) === 'number') {
      reqData.order = order;
    }
    const data = await this._requestData('/api/item/updateByApi', reqData);
    return pagePrefix + data.page_id;
  }

  async getPages() {
    const { itemID } = this.config;
    const data = await this._requestData('/api/item/info', { item_id: itemID });
    return this._buildDict(data.menu, '', {});
  }

  _buildDict(root, path, dict) {
    const { pagePrefix } = this.config;
    for (const page of root.pages) {
      dict[path + page.page_title] = pagePrefix + page.page_id;
    }
    for (const cat of root.catalogs) {
      this._buildDict(cat, path + cat.cat_name + '/', dict);
    }
    return dict;
  }
}

module.exports = ShowDocApi;
