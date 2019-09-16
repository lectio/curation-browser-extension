import React, { Component } from 'react';
import style from './CustomForm.css';
import ExtractedContent from './ExtractedContent';
import { Tabs, TabPanel } from '@cmsgov/design-system-core';
import * as config from '../constants/config.json';
import * as APIDATA from '../constants/apidata';
import Cookies from 'js-cookie';
// import apiData, { APIDATA.Base_Url } from '../constants/apidata';
import logo from '../../chrome/assets/img/logo-small.png';
export default class Customform extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      summary: '',
      message: '',
      image: '',
      categories: [],
      selectedCat: '',
      multiSelect: [],
      optionClicked: [],
      url: '',
      allImages: [],
      showPopup: false,
      selectedImage: -1,
      showEdit: true,
      showShare: false,
      showAttachmentTab: false,
      showImgTab: false,
      showMsgTab: false,
      showNotificationTab: false,
      showJsonTree: false,
      showSettings: false,
      ogData: [],
      metaData: [],
      taskId: '',
      siteUrl: '',
      isLogin: true,
      metaDataJSON: '',
      loader: false,
      fetchingContents: true,
      apiKey: '',
      messageApiKey: '',
      messageApiKeyErr: '',
      baseUrl: '',
      cookie: '',
      duplicateMessage: false,
      parentId: null
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSummary = this.handleSummary.bind(this);
    this.activateTabs = this.activateTabs.bind(this);
    this.getCookies = this.getCookies.bind(this);
    this.saveSetting = this.saveSetting.bind(this);
    this.updateConfigState = this.updateConfigState.bind(this);
    this.authenticate = this.authenticate.bind(this);
    this.signinTab = this.signinTab.bind(this);
  }
  componentDidMount() {
    // chrome.storage.local.get(['apiKey', 'baseUrl'], this.updateConfigState);
    this.authenticate();
    let selectedContent = '';
    chrome.tabs.executeScript({
      code: 'window.getSelection().toString();'
    }, function (selection) {
      if (selection[0]) {
        selectedContent = selection[0];
      }
    });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const url = tabs[0].url;
      this.setState({ url: url });
      const x = new XMLHttpRequest();
      x.open('GET', url);
      x.responseType = 'document';
      x.onload = function (e) {
        const doc = x.response;
        let title = doc.querySelector('meta[property="og:title"]');
        let desc = doc.querySelector('meta[property="og:description"]');
        let image = doc.querySelector('meta[property="og:image"]');
        const ogData = [];
        const og = doc.querySelectorAll("meta[property^='og']");
        let i = 0;
        for (i = 0; i < og.length; i++) {
          ogData.push({ 'name': og[i].attributes.property.nodeValue, content: og[i].attributes.content.nodeValue });
        }
        this.setState({ ogData: ogData });
        const metaDataOb = [];
        const meta = doc.getElementsByTagName('meta');
        let j = 0;
        for (j = 0; j < meta.length; j++) {
          if (meta.item(j).name != '') {
            metaDataOb.push({ 'name': meta.item(j).name, content: meta.item(j).content });
          }
        }
        this.setState({ metaData: metaDataOb });
        this.generateJSON(doc);
        if (x.readyState === 4) {
          if (x.status === 200) {
            this.findDuplicate();
            if (desc) {
              desc = desc.getAttribute('content');
              if (selectedContent !== '') {
                this.setState({ summary: selectedContent });
              } else {
                this.setState({ summary: desc });
              }
            }
            if (title) {
              title = title.getAttribute('content');
              title = title.split(/[-|]/);
              title = title[0];
              this.setState({ value: title });
            }
            if (image) {
              image = image.getAttribute('content');
              const pattern = /^((http|https|www):\/\/)/;
              if (!pattern.test(image)) {
                let baseUrl = this.state.url.split('/');
                baseUrl = baseUrl[0] + "//" + baseUrl[2];
                image = baseUrl + image;
              }
              this.setState({ image: image });
            }
          } else {
            this.setState({ fetchingContents: false });
          }
        }
        const images = doc.getElementsByTagName('img');
        const srcList = [];
        if (image) {
          srcList.push(image);
        }
        for (let i = 0; i < images.length; i++) {
          const img = images[i].src;
          const res = img.match(/ajax|email|icon|FB|social|small|facebook|logo/gi);
          if ((res == null) && (srcList.indexOf(img) === -1)) {
            const validUrl = this.checkURL(img);
            if (validUrl) {
              srcList.push(img);
            }
          }
        }
        this.setState({ allImages: srcList });
      }.bind(this);
      x.onerror = function (e) {
      };
      x.send(null);
    }.bind(this));
  }
  checkURL(url) {
    return (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
  }
  findDuplicate() {
    const filterParam = 'filters=[{"' + APIDATA.cleanUrlField + '":{"operator":"~","values":["' + this.generateCleanURL(this.state.url) + '"]}}]';
    const filterData = {
      method: 'GET',
      credentials: 'include',
      headers: {
        // Authorization: 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(APIDATA.BASE_URL + APIDATA.API_URL + '/projects/' + APIDATA.PROJECT_ID + '/work_packages/?' + filterParam, filterData)
      .then(response => {
        return response.json();
      }).then((responseData) => {
        this.setState({ fetchingContents: false });
        if (typeof (responseData['_embedded']['elements']) !== 'undefined') {
          const duplicateElements = responseData['_embedded']['elements'];
          if (duplicateElements.length > 0) {
            let lowest = Number.POSITIVE_INFINITY;
            let tmp;
            for (let i = duplicateElements.length - 1; i >= 0; i--) {
              tmp = duplicateElements[i].id;
              if (tmp < lowest) lowest = tmp;
            }
            this.setState({ parentId: lowest });
          }
        }
      });
  }
  handleChange(event) {
    this.setState({ value: event.target.value });
  }
  handleUrl(event) {
    this.setState({ url: event.target.value });
  }
  handleSummary(event) {
    this.setState({ summary: event.target.value });
  }
  handleApikey = e => {
    this.setState({ apiKey: e.target.value });
  }
  handleBaseUrl = e => {
    this.setState({ baseUrl: e.target.value });
  }
  saveSetting(event) {
    event.preventDefault();

    const authdata = {
      method: 'GET',
      credentials: 'include',
      headers: {
        // 'Authorization': 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(APIDATA.BASE_URL + APIDATA.API_URL + '/my_preferences/', authdata)
      .then(response => {
        if (response.status === 200) {
          const obj = {};
          obj['apiKey'] = this.state.apiKey;
          obj['baseUrl'] = this.state.baseUrl;
          chrome.storage.local.set(obj);
          this.setState({ messageApiKey: 'ApiKey Saved Successfully.' });
          this.setState({ messageApiKeyErr: '' });
        } else {
          this.setState({ messageApiKeyErr: 'Invalid API Key.' });
          this.setState({ messageApiKey: '' });

        }
        return response.json();
      }).catch(response => {
        this.setState({ messageApiKeyErr: 'Invalid API Key / Base Url.' });
        this.setState({ messageApiKey: '' });
      });
  }
  togglePopup() {
    this.setState({
      showPopup: !this.state.showPopup
    });
  }
  updateConfigState(val) {
  }
  handleChangeValue = e => {
    this.setState({ showPopup: e.target.value });
    this.setState({ selectedImage: e.target.alt });
    this.setState({ image: this.state.allImages[Number(e.target.alt)] });
  }
  signinTab(){
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const url = tabs[0].url;
      if (url.indexOf(APIDATA.BASE_URL) == -1){
        chrome.tabs.create({url:APIDATA.BASE_URL}, function(tab) {});
      } 
    });
  }
  authenticate(){
    const authdata = {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Requested-With':'XMLHttpRequest'
      }
    };
    this.getCookies(APIDATA.BASE_URL, '_open_project_session', cookies => {
      // console.log('ck',cookies);
      chrome.cookies.set({ url: APIDATA.BASE_URL, name: '_open_project_session', value: cookies });
      fetch(APIDATA.BASE_URL + APIDATA.API_URL + '/my_preferences/', authdata)
      .then(response => {
        if (response.status === 200) {
          this.setState({authenticate: true});
        } else {
          this.setState({isLogin : false});
          this.setState({showEdit : false});
          this.setState({showSettings : true});
          this.setState({authenticate: false});
        }
        return response.json();
      }).catch(response=> {
          this.setState({isLogin : false});
          this.setState({showEdit : false});
          this.setState({showSettings : true});
          this.setState({authenticate: false});
      });
    });
  }
  handleSubmit(event) {
    event.preventDefault();
    const filterParam = 'filters=[{"' + APIDATA.cleanUrlField + '":{"operator":"~","values":["' + this.generateCleanURL(this.state.url) + '"]}}]';
    let total = 0;
    const filterData = {
      method: 'GET',
      credentials: 'include',
      headers: {
        // Authorization: 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    fetch(APIDATA.BASE_URL + APIDATA.API_URL + '/projects/' + APIDATA.PROJECT_ID + '/work_packages/?' + filterParam, filterData)
      .then(response => {
        return response.json();
      }).then((respdata) => {
        total = respdata.total;
        if (Number(total) > 0) {
          this.setState({ duplicateMessage: 'Duplicate Entry.' });
        } else {
          this.setState({ loader: true });
          let params = 'title=' + this.state.value +
            '&url=' + this.state.value +
            '&summary=' + this.state.summary +
            '&tags=' + this.state.value;
          // Replace any instances of the URLEncoded space char with +
          params = params.replace(/%20/g, '+');
          params = JSON.stringify({
            subject: this.state.value,
            description: {
              format: 'markdown',
              raw: this.state.summary,
              html: ''
            },
            customField1: this.state.url,
            customField2: this.generateCleanURL(this.state.url),
            _links: {
              type: {
                href: '/api/v3/types/8',
                title: 'Post'
              },
            }
          });
          const data = {
            method: 'POST',
            body: params,
            credentials: 'include',
            headers: {
              // Authorization: 'Basic ' + btoa('apikey:' + this.state.apiKey),
              'X-Requested-With': 'XMLHttpRequest',
              'Content-Type': 'application/json;charset=UTF-8',
            }
          };
          fetch(APIDATA.BASE_URL + APIDATA.API_URL + '/projects/' + APIDATA.PROJECT_ID + '/work_packages/', data)
            .then(response => {
              if (response.status === 201) {
                // this.setState({ message: 'Saved Successfully.' });
              }
              return response.json();
            }).then((catdata) => {
              const webPackageId = catdata.id;
              this.setState({ taskId: webPackageId });
              this.toDataUrl(this.state.image, (myBase64) => {
                this.uploadImage(webPackageId, myBase64);
              });
              this.setState({ siteUrl: APIDATA.SITE_URL });
              this.setState({ message: 'Saved in ' + APIDATA.DOMAIN_NAME + ' as' });
              this.setState({ loader: false });
              this.uploadOgData(webPackageId);
              this.uploadMetaData(webPackageId);
            });
        }
      });
  }
  // eslint-disable-next-line camelcase
  // eslint-disable-next-line class-methods-use-this
  stripQsVar(sourcestr, url, key) {
    if (String.prototype.indexOf(url, sourcestr) > 0) {
      return preg_replace('/(' + key + '=.*?)&/', '', url);
    } else {
      return url;
    }
  }

  removeUrlParameters(sourcestr, url, key) {
    if (String.prototype.indexOf(url, sourcestr) > 0) {
      return preg_replace('/utm_.*?(&|$)/g', '', url);
    } else {
      return url;
    }
  }

  stripQsVarMatch(sourcestr, url, key) {
    if (String.prototype.indexOf(url, sourcestr) > 0) {
      const parts = parse_url(html_entity_decode(url));
      parse_str(parts['query'], query);
      return query[key];
    } else {
      return url;
    }
  }

  generateJSON(doc) {

    const twitterData = [];
    const twitter = doc.querySelectorAll("meta[property^='twitter']");
    let i = 0;
    for (i = 0; i < twitter.length; i++) {
      twitterData.push({ 'name': twitter[i].attributes.property.nodeValue, content: twitter[i].attributes.content.nodeValue });
    }
    const metaData = [];
    metaData.push({ 'name': 'Curated OpenGraph', content: this.state.ogData });
    metaData.push({ 'name': 'Curated Twitter', content: twitterData });
    metaData.push({ 'name': 'Curated Meta Data', content: this.state.metaData });
    const databody = JSON.stringify(metaData);
    this.setState({ metaDataJSON: databody });
  }

  generateCleanURL(url) {
    const thisLink = url.replace(/(\?)utm[^&]*(?:&utm[^&]*)*&(?=(?!utm[^\s&=]*=)[^\s&=]+=)|\?utm[^&]*(?:&utm[^&]*)*$|&utm[^&]*/gi, '$1');
    return thisLink;
  }

  toDataUrl = (url, callback) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        callback(this.response);
        const img = document.getElementById('img');
        const objUrl = window.URL || window.webkitURL;
        img.src = objUrl.createObjectURL(this.response);
      }
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  }

  uploadImage(id, data) {
    const databody = JSON.stringify({ "fileName": "Curated Featured Image.png", "description": { "raw": "A cute kitty, cuddling with its friends!" } });
    const formBody = new FormData();
    formBody.append('metadata', databody);
    formBody.append('file', data, 'opengraph-logo.72382e605ce3.png');
    const authdata = {
      method: 'POST',
      body: formBody,
      credentials: 'include',
      headers: {
        // 'Authorization': 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(APIDATA.BASE_URL + APIDATA.API_URL + '/work_packages/' + id + '/attachments', authdata);
  }
  uploadOgData(id) {
    const ogFile = new Blob([JSON.stringify(this.state.ogData)], { type: 'application/json' });
    const fr = new FileReader();
    fr.readAsText(ogFile);
    const databody = JSON.stringify({ 'fileName': 'Curated OpenGraph.json', 'description': { 'raw': 'A cute kitty, cuddling with its friends!' } });
    const formBody = new FormData();
    formBody.append('metadata', databody);
    formBody.append('file', ogFile, 'ogData.json');
    const authdata = {
      method: 'POST',
      body: formBody,
      credentials: 'include',
      headers: {
        // 'Authorization': 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(APIDATA.BASE_URL + APIDATA.API_URL + '/work_packages/' + id + '/attachments', authdata);
  }
  uploadMetaData(id) {
    const ogFile = new Blob([JSON.stringify(this.state.metaData)], { type: 'application/json' });
    const fr = new FileReader();
    fr.readAsText(ogFile);
    const databody = JSON.stringify({ 'fileName': 'Curated MetaData.json', 'description': { 'raw': 'A cute kitty, cuddling with its friends!' } });
    const formBody = new FormData();
    formBody.append('metadata', databody);
    formBody.append('file', ogFile, 'ogData.json');
    const authdata = {
      method: 'POST',
      body: formBody,
      credentials: 'include',
      headers: {
        // 'Authorization': 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(APIDATA.BASE_URL + APIDATA.API_URL + '/work_packages/' + id + '/attachments', authdata);
  }
  activateTabs(event) {
    event.preventDefault();
    let editTab = false;
    let shareTab = false;
    let attachmentTab = false;
    let imgTab = false;
    let msgTab = false;
    let notificationTab = false;
    let jsonTreeTab = false;
    let showSettingsTab = false;
    if (String(event.target.id) === 'editTab') {
      editTab = true;
    } else if (String(event.target.id) === 'shareTab') {
      shareTab = true;
    } else if (String(event.target.id) === 'attachmentTab') {
      attachmentTab = true;
    } else if (String(event.target.id) === 'imgTab') {
      imgTab = true;
    } else if (String(event.target.id) === 'msgTab') {
      msgTab = true;
    } else if (String(event.target.id) === 'notificationTab') {
      notificationTab = true;
    } else if (String(event.target.id) === 'jsonTree') {
      jsonTreeTab = true;
    } else if (String(event.target.id) === 'settingsTab') {
      showSettingsTab = true;
    }
    this.setState({
      showEdit: editTab,
      showShare: shareTab,
      showAttachmentTab: attachmentTab,
      showImgTab: imgTab,
      showMsgTab: msgTab,
      showNotificationTab: notificationTab,
      showJsonTree: jsonTreeTab,
      showSettings: showSettingsTab
    });
  }
  getCookies(domain, name, callback) {
    chrome.cookies.get({ 'url': domain, 'name': name }, function (cookie) {
      if (callback) {
        if (cookie) {
          callback(cookie.value);
        } else {
          callback(null);
        }
      }
    });
  }
  render() {
    return (
      <section className={style.sectionContent}>
        {this.state.isLogin ? <div className="ds-l-container">
          <div className="ds-l-row">
            <div className="ds-u-padding--0 ds-l-col--11">
              {this.state.showEdit ?
                <div id="panel-edit">
                  <form onSubmit={this.handleSubmit}>
                    <p>
                      <textarea className={[style.textareaTitle, 'preview__label ds-u-font-size--h4 ds-u-font-style--normal'].join(' ')} value={this.state.value} onChange={this.handleChange} />
                    </p>
                    <hr className="on ds-u-fill--gray-lightest" />
                    {this.state.fetchingContents ? <p className="ds-u-text-align--center">
                      <button className="ds-c-button">
                        <span className="ds-c-spinner ds-c-spinner--small" aria-valuetext="Fetching Contents" role="progressbar"></span> Fetching Contents
                        </button>
                    </p> : null}
                    <p>
                      <label>
                        <textarea className={[style.textareaDesc, 'preview__label ds-u-font-size--small ds-u-font-style--normal'].join(' ')} value={this.state.summary} onChange={this.handleSummary} />
                      </label>
                    </p>

                    <p className={style.ogImageContainer}>
                      {this.state.image.length > 0 ?
                        <img id="imgTab" onClick={this.activateTabs} src={this.state.image} className={style.ogImages} alt="Og Image"></img>
                        : null}
                    </p>
                    {this.state.fetchingContents ? null : <div><hr className="on ds-u-fill--gray-lightest" /><p className="ds-u-margin--0">
                      <label>
                        <input type="text" className={this.state.parentId ? [style.textareaLink, 'preview__label ds-u-font-style--normal ds-u-color--white on ds-u-fill--secondary-dark'].join(' ') : [style.textareaLink, 'preview__label ds-u-font-style--normal'].join(' ')} value={this.generateCleanURL(this.state.url)} onChange={this.handleUrl} style={this.state.parentId ? { height: '20px' } : { height: '10px' }} />
                      </label>
                    </p></div>}
                    <hr className="on ds-u-fill--gray-lightest" />
                    {this.state.fetchingContents ? null : <div className={style.sucessBlock}>
                      {this.state.loader ? <button className="ds-u-margin--0 ds-c-button ds-c-button--primary">
                        <span className="ds-c-spinner ds-c-spinner--small ds-c-spinner--inverse" aria-valuetext="Saving" role="progressbar"></span> Saving
                        </button> : null}
                      {this.state.duplicateMessage == '' && this.state.message == '' && this.state.loader == false ? <input type="submit" value="Post to Lectio" className="ds-u-margin-left--1 ds-c-button ds-c-button--primary" /> : null}
                      {this.state.duplicateMessage != '' ?
                        <div className="ds-c-alert ds-c-alert--danger">
                          <div className="ds-c-alert__body">
                            <p className="ds-c-alert__text">{this.state.duplicateMessage} </p>
                          </div>
                        </div> : null}
                      {this.state.message != '' ?
                        <div className="ds-c-alert ds-c-alert--success">
                          <div className="ds-c-alert__body">
                            <p className="ds-c-alert__text">{this.state.message} <a target="_blank" href={APIDATA.BASE_URL + APIDATA.SITE_URL + this.state.taskId}>{this.state.taskId ? "#" + this.state.taskId : null}</a></p>
                          </div>
                        </div> : null}
                    </div>}

                  </form>
                </div>
                : null}
              {this.state.showJsonTree ? <div id="panel-meta">
                <div className="usa-accordion site-accordion-code">
                  <h4 className="usa-accordion__heading site-accordion-code">
                    <button
                      className="usa-accordion__button"
                      aria-expanded="true"
                      aria-controls="metaDataContent">
                      Extracted meta data
              </button>
                  </h4>
                  <div id="metaDataContent" className="usa-accordion__content usa-prose">
                    <ExtractedContent jsonData={this.state.metaDataJSON} ></ExtractedContent>
                  </div>
                </div>

              </div> : null}
              {this.state.showShare ? <div id="panel-share"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
              {this.state.showAttachmentTab ? <div id="panel-attachment"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
              {this.state.showImgTab ? <div id="panel-img"><Popup
                text='Close'
                closePopup={this.togglePopup.bind(this)}
                images={this.state.allImages}
                selectedImage={this.state.allImages}
                onChangeValue={this.handleChangeValue}
              />
              </div> : null}
              {this.state.showMsgTab ? <div id="panel-msg"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
              {this.state.showNotificationTab ? <div id="panel-notification"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
              {this.state.showSettings ? <div id="panel-notification">
                {/* <div className="usa-accordion site-accordion-code">
                  <h4 className="usa-accordion__heading site-accordion-code">
                    <button
                      className="usa-accordion__button"
                      aria-expanded="true"
                      aria-controls="configurationSettings">
                      Configuration and Settings
              </button>
                  </h4>
                  <div id="configurationSettings" className="usa-accordion__content usa-prose">
                    <p className="ds-u-margin--0 preview__label ds-u-font-size--base ds-u-font-style--normal">
                      <label> OpenProject Token ID
                        <input type="text" className="ds-c-field ds-u-border--1" value={this.state.apiKey} onChange={this.handleApikey} />
                      </label>
                    </p>

                    <p className="ds-u-margin--0 preview__label ds-u-font-size--base ds-u-font-style--normal">
                      <label> OpenProject Base Url
                        <input type="text" className="ds-c-field ds-u-border--1" value={this.state.baseUrl} onChange={this.handleBaseUrl} />
                      </label>
                    </p>
                    <input type="button" value="Save Settings" className="ds-u-margin--0 ds-c-button ds-c-button--primary" onClick={this.saveSetting} />
                    {this.state.messageApiKey != '' ?
                      <div className="ds-u-margin-top--1 ds-c-alert ds-c-alert--success">
                        <div className="ds-c-alert__body">
                          <p className="ds-c-alert__text">{this.state.messageApiKey} </p>
                        </div>
                      </div> : null}

                    {this.state.messageApiKeyErr != '' ?
                      <div className="ds-u-margin-top--1 ds-c-alert ds-c-alert--danger">
                        <div className="ds-c-alert__body">
                          <p className="ds-c-alert__text">{this.state.messageApiKeyErr} </p>
                        </div>
                      </div> : null}
                  </div>
                </div> */}
              </div> : null}
            </div>
            <div className={[style.sideBar, 'ds-u-padding--0 ds-l-col--1 ds-u-border-left--1'].join(' ')}>
              <div>
                <div>
                  <ul className={[style.verticalNavCustom, 'ds-c-vertical-nav'].join(' ')}>
                    <li className={this.state.showEdit ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                      <a className={this.state.showEdit ? [style.editActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.editInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="editTab"></a>
                    </li>
                    <li className={this.state.showJsonTree ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                      <a className={this.state.showJsonTree ? [style.metaActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.metaInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="jsonTree"></a>
                    </li>
                    <li className={this.state.showImgTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                      <a className={this.state.showImgTab ? [style.imgActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.imgInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="imgTab"></a>
                    </li>
                    <li className={this.state.showShare ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                      <a className={this.state.showShare ? [style.shareActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.shareInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="shareTab"></a>
                    </li>
                    <li className={this.state.showNotificationTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                      <a className={this.state.showNotificationTab ? [style.notificationActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.notificationInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="notificationTab"></a>
                    </li>
                    <li className={this.state.showAttachmentTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                      <a className={this.state.showAttachmentTab ? [style.attachmentActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.attachmentInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="attachmentTab"></a>
                    </li>
                    <li className={this.state.showMsgTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                      <a className={this.state.showMsgTab ? [style.messageActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.messageInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="msgTab"></a>
                    </li>
                    <li className={this.state.showSettings ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                      <a className={this.state.showSettings ? [style.settingsActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.settingsInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="settingsTab"></a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div> : <div>
            <div>
              <img id="logoIcon" className={style.logoSmall} src={logo} alt="Lectio" />
            </div>
            <div className="ds-u-font-size--h3 ds-u-text-align--center ds-u-margin-bottom--3">
              You are not authenticated yet, <br />please log in to continue.
          </div>
            <hr className="on ds-u-fill--gray-lightest" />
            <div className="ds-u-text-align--center ds-u-margin-top--4">
              <div claasName="ds-u-margin-top--4"><a className="ds-c-button ds-c-button--primary" onClick={this.signinTab}  >Sign in</a></div>
              <div className="ds-u-font-style--italic ds-u-margin-top--4 ds-u-margin-bottom--2">
                After you’ve signed in, <br />please click the extension button again.
            </div>
            </div>
          </div>}
      </section>
    );
  }
}

class Popup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      src: this.props.selectedImage.length > 0 ? this.props.selectedImage : null,
      probs: this.props,
      articleTab: true,
      customTab: false,
      imgHeight: '',
      imgWidth: ''
    };
    this.handleClick = this.handleClick.bind(this);
    this.openTab = this.openTab.bind(this);
    this.fileChangedHandler = this.fileChangedHandler.bind(this);
  }
  componentDidMount() {

    if (this.props.images.length > 0) {
      const theImage = new Image();
      theImage.src = this.props.images[0];
      const self = this;
      theImage.onload = function () {
        self.setState({
          imgHeight: theImage.height,
          imgWidth: theImage.width
        });
      };
      this.setState({ src: this.props.images[0] });
    }
  }
  fileChangedHandler = event => {
    this.setState({ src: event.target.files[0] });
  }
  handleClick(event) {
    const theImage = new Image();
    const self = this;
    theImage.src = event.target.src;
    theImage.onload = function () {
      self.setState({
        imgHeight: theImage.height,
        imgWidth: theImage.width
      });
    };
    this.setState({ src: event.target.src });
    this.state.probs.onChangeValue(event);
  }

  openTab(event) {
    event.preventDefault();
    let article = false;
    let custom = false;
    if (String(event.target.id) === 'articleTab') {
      article = true;
    } else if (String(event.target.id) === 'customTab') {
      custom = true;
    }
    this.setState({
      articleTab: article,
      customTab: custom
    });
  }
  render() {
    return (
      <div>
        <div className="usa-accordion site-accordion-code">
          <h4 className="usa-accordion__heading site-accordion-code">
            <button
              className="usa-accordion__button"
              aria-expanded="true"
              aria-controls="featurePage">
              Feature page image
              </button>
          </h4>
          <div id="featurePage" className="usa-accordion__content usa-prose">
            {this.state.src ? <p className="ds-u-margin-top--0">
              <img src={this.state.src} className={style.ogImages}></img>
              <span className={[style.imgSizeDisplay, 'preview__label ds-u-font-size--base ds-u-font-style--normal'].join(' ')}>{this.state.imgHeight} x {this.state.imgWidth} px</span>
            </p> : null}
            <Tabs>
              <TabPanel id="article" className={style.imageGallery} tab="Article images">
                <div className="ds-u-clearfix ">
                  <section className="ds-l-container">
                    <div className="ds-l-row">
                      {this.props.images.map((value, index) => {
                        return <div className={this.state.src == value ? "ds-l-col--4 ds-u-padding--1 ds-u-border--dark ds-u-border--1" : "ds-l-col--4 ds-u-padding--1 ds-u-border--1"}><img id="editTab" onClick={this.handleClick} alt={index} className={style.object_fit_cover} src={value} width="100" height="100"></img></div>;
                      })}
                    </div>
                  </section>
                </div>
              </TabPanel>
              <TabPanel id="custom" tab="Custom image">
                <div>
                  <input className="ds-c-field ds-u-border--1" id="input-text" type="text"></input>
                  <input className="ds-c-field" id="input-file" type="file" onChange={this.fileChangedHandler}></input>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
}
