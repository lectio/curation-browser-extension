/* eslint-disable no-console */
import React, { Component } from 'react';
import style from './CustomForm.css';
import ExtractedContent from './ExtractedContent';
import ShareContent from './ShareContent';
import Feedback from './Feedback';
import Popup from './Popup';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import logo from '../../chrome/assets/img/logo-small.png';
import pdfImage from '../../chrome/assets/img/edit-pdf.png';
import * as Insatance from '../constants/config.json';
import * as pdf from 'pdfjs-dist';
import ConfigLoaderClass from './ConfigLoader';
import APIDATA from '../constants/apidata';

const urlExists = require('url-exists');

export default class Customform extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      summary: '',
      message: '',
      image: '',
      categories: [],
      selectedCat: '',
      multiSelect: [],
      optionClicked: [],
      url: '',
      cleanUrl: '',
      allImages: [],
      showPopup: false,
      selectedImage: 0,
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
      domContents: '',
      loader: false,
      loaderLoading: false,
      fetchingContents: true,
      apiKey: '',
      messageApiKey: '',
      extLocalConfigName: '',
      baseUrl: '',
      cookie: '',
      duplicateMessage: '',
      parentId: null,
      favIcon: null,
      extConfig: [],
      contentTypes: [],
      contentTypeSelected: '',
      doc: '',
      domInitial: '',
      showAutoClassificationTab: false,
      mozilaReadability: '',
      isPdf: false,
      readabilityTitle: '',
      readabilityExcerpt: '',
      readabilityByline: '',
      readabilityContent: '',
      initialSummary: '',
      twitterTag: '',
      meshData: [],
      extractedKeyWords: [],
      rssFeed: [],
      instanceData: [],
      SelectedInstanceId: '',
      SelectedProjectIndex: '',
      SelectedProject: '',
      apiUrl: '',
      baseURL: '',
      domain: '',
      projectIdentifier: '',
      configdata: [],
      allDomains: [],
      projectSelected: ''
    };
    this.manifestData = chrome.runtime.getManifest();
    this.ConfigLoader = new ConfigLoaderClass();
    this.loadConfig = this.loadConfig.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSummary = this.handleSummary.bind(this);
    this.handleUrl = this.handleUrl.bind(this);
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.activateTabs = this.activateTabs.bind(this);
    this.authenticate = this.authenticate.bind(this);
    this.signinTab = this.signinTab.bind(this);
    this.checkURL = this.checkURL.bind(this);
    this.getCookies = this.getCookies.bind(this);
    this.contentChange = this.contentChange.bind(this);
    this.shareDataChange = this.shareDataChange.bind(this);
    this.metadataReading = this.metadataReading.bind(this);
    this.isPdfLink = this.isPdfLink.bind(this);
    this.replaceWithReadableContent = this.replaceWithReadableContent.bind(this);
    this.replaceWithReadableContentAndMeta = this.replaceWithReadableContentAndMeta.bind(this);
    this.clearImage = this.clearImage.bind(this);
    this.clearContent = this.clearContent.bind(this);
    this.appendReadableContent = this.appendReadableContent.bind(this);
    this.handleProjectChange = this.handleProjectChange.bind(this);
    this.needToLogin = [];
  }
  async componentDidMount() {
    this.getAlldomains();
    const response = await this.loadConfig();
    await chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs) {
        const tabUrl = tabs[0].url;
        const pattern = /^((http|https|www):\/\/)/;
        let selectedContent = '';
        if (pattern.test(tabUrl)) {
          chrome.tabs.executeScript({
            code: 'window.getSelection().toString();'
          }, (selection) => {
            if (selection && selection[0]) {
              selectedContent = selection[0];
            }
          });
        }
        this.setState({ url: tabUrl, cleanUrl: this.generateCleanURL(tabUrl) });
        const isPDF = this.isPdfLink(tabUrl);
        isPDF.then((pdfResponse) => {
          if (pdfResponse === 'pdf') {
            if (tabUrl.indexOf('http://') === 0 || tabUrl.indexOf('https://') === 0) {
              // this.findDuplicate();
              this.metadataReading(tabUrl);
            } else {
              this.setState({ fetchingContents: false });
            }
          } else {
            const x = new XMLHttpRequest();
            x.open('GET', tabUrl);
            x.responseType = 'document';
            x.onload = (e) => {
              e.preventDefault();
              const doc = x.response;
              if (doc) {
                const ogTitle = doc.querySelector('meta[property="og:title"]');
                const ogDesc = doc.querySelector('meta[property="og:description"]');
                const ogSiteName = doc.querySelector('meta[property="og:site_name"]');
                const siteName = ogSiteName ? ogSiteName.getAttribute('content') : '';
                let desc = '';
                let title = '';
                const image = doc.querySelector('meta[property="og:image"]');
                const dcTitle = doc.querySelector('meta[name="DC.Title"]');
                const metaDescription = doc.querySelector('meta[name="description"]');
                const metaTitle = doc.querySelector('meta[name="title"]');
                const titleTag = doc.querySelector('title').innerHTML;
                const rssFeeds = doc.querySelectorAll('link[type="application/rss+xml"]');
                const article = new Readability(doc).parse();
                if (article) {
                  this.setState({
                    mozilaReadability: article,
                    readabilityTitle: article.title,
                    readabilityExcerpt: article.excerpt,
                    readabilityByline: article.byline,
                    readabilityContent: article.content,
                    domContents: article.content,
                    domInitial: article.content,
                  });
                }
                if (ogTitle) {
                  title = ogTitle.getAttribute('content');
                } else if (dcTitle && title === '') {
                  title = dcTitle.getAttribute('content');
                } else if (metaTitle && title === '') {
                  title = metaTitle.getAttribute('content');
                } else if (titleTag && title === '') {
                  title = titleTag;
                }
                title = title.trim();
                if (!title) {
                  title = article.title;
                }
                if (ogDesc) {
                  desc = ogDesc.getAttribute('content');
                } else if (metaDescription && desc === '') {
                  desc = metaDescription.getAttribute('content');
                }
                if (!desc && article) {
                  desc = article.content;
                }
                const ogData = [];
                const og = doc.querySelectorAll("meta[property^='og']");
                let favicon;
                const nodeList = doc.querySelectorAll('link');
                for (let i = 0; i < nodeList.length; i++) {
                  if ((nodeList[i].getAttribute('rel') === 'icon') || (nodeList[i].getAttribute('rel') === 'shortcut icon')) {
                    favicon = nodeList[i].getAttribute('href');
                  }
                }
                let i = 0;
                for (i = 0; i < og.length; i++) {
                  ogData.push({ name: og[i].attributes.property.nodeValue, content: og[i].attributes.content.nodeValue });
                }
                this.setState({ ogData });
                const metaDataOb = [];
                const meta = doc.getElementsByTagName('meta');
                let j = 0;
                for (j = 0; j < meta.length; j++) {
                  if (meta.item(j).name !== '') {
                    metaDataOb.push({ name: meta.item(j).name, content: meta.item(j).content });
                  }
                }
                this.setState({ metaData: metaDataOb });
                if (rssFeeds.length > 0) {
                  let n = 0;
                  const rssFeedData = [];
                  for (n = 0; n < rssFeeds.length; n++) {
                    const rssUrl = rssFeeds[n].getAttribute('href');
                    const rssTitle = rssFeeds[n].getAttribute('title');
                    const tempObj = {
                      url: rssUrl,
                      title: rssTitle
                    };
                    rssFeedData.push(tempObj);
                  }
                  this.setState({ rssFeed: rssFeedData });
                }
                this.generateJSON(doc);
                if (x.readyState === 4) {
                  if (x.status === 200) {
                    this.setState({ fetchingContents: false });
                    // this.findDuplicate();
                    const self = this;
                    let baseUrl = this.state.url.split('/');
                    let readMoreurl = `${baseUrl[2]}`;
                    readMoreurl = readMoreurl.replace('www.', '');
                    const readMore = `<br><a target="_blank" href=${this.state.cleanUrl}>Read on ${readMoreurl}</a>`;
                    // const readMore = `<br>[Read on ${readMoreurl}](${this.state.cleanUrl})`;
                    if (desc && selectedContent === '') {
                      desc += '<br>';
                      desc += readMore;
                      this.setState({
                        summary: desc
                      });
                    } else {
                      if (selectedContent !== '') {
                        selectedContent += '<br>';
                        selectedContent += readMore;
                      }
                      this.setState({ summary: selectedContent });
                    }
                    if (title) {
                      let titleValue = title.split('--');
                      titleValue = titleValue[0].split(/[»|]/);
                      titleValue = titleValue[0];
                      const restTitle = titleValue.substring(0, titleValue.lastIndexOf('-') + 1);
                      const lastTitle = titleValue.substring(titleValue.lastIndexOf('-') + 1, titleValue.length);
                      if (siteName) {
                        if ((lastTitle.toLowerCase()).trim() === (siteName.toLowerCase()).trim()) {
                          titleValue = restTitle.replace('-', '');
                          titleValue = titleValue.trim();
                        }
                      }
                      this.setState({ title: titleValue });
                    }
                    const allImages = doc.getElementsByTagName('img');
                    if (image) {
                      let ogImage = image.getAttribute('content');
                      if (!pattern.test(ogImage)) {
                        baseUrl = `${baseUrl[0]}//${baseUrl[2]}`;
                        ogImage = baseUrl + ogImage;
                      }
                      urlExists(ogImage, (err, exists) => {
                        if (exists) {
                          this.setState({ image: ogImage });
                        }
                        this.setAllImages(allImages);
                      });
                    } else {
                      this.setAllImages(allImages);
                    }
                    if (favicon) {
                      if (favicon.startsWith('//')) {
                        favicon = baseUrl[0] + favicon;
                      } else if (!pattern.test(favicon)) {
                        baseUrl = `${baseUrl[0]}//${baseUrl[2]}`;
                        favicon = baseUrl + favicon;
                      }
                      urlExists(favicon, (err, exists) => {
                        if (exists) {
                          self.setState({ favIcon: favicon });
                        }
                      });
                    }
                    this.setState({
                      doc
                    });
                  } else {
                    this.setState({ fetchingContents: false });
                  }
                }
              } else {
                this.setState({ fetchingContents: false });
              }
            };
            x.onerror = (e) => {
              this.setState({ fetchingContents: false });
              throw e;
            };
            if (pattern.test(tabUrl)) {
              x.send(null);
            } else {
              this.setState({ fetchingContents: false });
            }
          }
        });
      }
    });
  }
  log = (text, data) => new Promise((resolve) => {
    // console.log('===========================================================================================================');
    // console.log(text, JSON.stringify(data));
  });
  checkURL(url) {
    return (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
  }
  setAllImages(images) {
    const srcList = [];
    if (this.state.image) {
      const validUrl = this.checkURL(this.state.image);
      if (validUrl) {
        srcList.push(this.state.image);
      }
    }
    for (let i = 0; i < images.length; i++) {
      const img = images[i].src;
      const res = img.match(/ajax|email|icon|FB|social|facebook/gi);
      if ((res == null) && (srcList.indexOf(img) === -1)) {
        const validUrl = this.checkURL(img);
        if (validUrl) {
          srcList.push(img);
        }
      }
    }
    this.setState({ allImages: srcList });
  }
  getAlldomains() {
    const instancesKeys = Object.keys(Insatance.default);
    const domainNames = [];
    for (let k = 0; k < instancesKeys.length; k++) {
      const keyVal = instancesKeys[k];
      const tempObj = {
        domain: Insatance.default[keyVal].domain,
        domainName: Insatance.default[keyVal].extensionUI.displayName
      };
      domainNames.push(tempObj);
    }
    this.setState({ allDomains: domainNames });
  }
  async findDuplicate() {
    const cleanUrl = this.state.cleanUrl;
    this.setState({ loaderLoading: true });
    const filterByCleanUrl = `filters=[{"${this.state.configdata.customFields.cleanUrlField}":{"operator":"~","values":["${encodeURIComponent(cleanUrl)}"]}}]`;
    const filterData = {
      method: 'GET',
      credentials: 'include',
      headers: {
        // Authorization: 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(`${this.state.apiUrl}/projects/${this.state.SelectedProject}/work_packages/?${filterByCleanUrl}`, filterData)
      .then(response => response.json()).then((responseData) => {
        if (typeof (responseData._embedded) !== 'undefined') {
          const duplicateElements = responseData._embedded.elements;
          let duplicateMsg = '';
          if (duplicateElements.length > 0) {
            const lowest = duplicateElements[0].id;
            this.setState({ loaderLoading: false });
            this.setState({ fetchingContents: false });
            duplicateMsg = `Clean URL duplicate of # ${lowest}`;
            this.setState({ parentId: lowest, duplicateMessage: duplicateMsg });
          } else {
            const filterBySourceUrl = `filters=[{"${this.state.configdata.customFields.sourceUrlField}":{"operator":"~","values":["${encodeURIComponent(this.state.url)}"]}}]`;
            fetch(`${this.state.apiUrl}/projects/${this.state.SelectedProject}/work_packages/?${filterBySourceUrl}`, filterData)
              .then(res => res.json()).then((resData) => {
                this.setState({ fetchingContents: false });
                if (typeof (resData._embedded) !== 'undefined') {
                  const duplicateElements = resData._embedded.elements;
                  if (duplicateElements.length > 0) {
                    const lowest = duplicateElements[0].id;
                    duplicateMsg = `Source URL duplicate of # ${lowest}`;
                    this.setState({ parentId: lowest, duplicateMessage: duplicateMsg });
                  } else {
                    this.setState({ parentId: null, duplicateMessage: '' });
                  }

                  this.setState({ loaderLoading: false });
                }
              });
          }
        }
      });
  }

  handleChange(event) {
    this.setState({ title: event.target.value });
  }

  handleUrl(event) {
    this.setState({ cleanUrl: event.target.value });
  }

  async handleTypeChange(event) {
    const selected = event.target.value;
    this.log('event', selected);
    await this.setState({ contentTypeSelected: selected });
    await this.setState({ SelectedInstance: selected });
  }
  handleSummary(event) {
    this.setState({ summary: event.target.value });
  }
  async handleProjectChange(event) {
    const selected = event.target.value.split('--'); 
    // this.log('selected',this.state.instanceData);
    this.setState({ projectSelected: event.target.value });
    await this.setState({ SelectedInstance: '' });
    await this.setState({ SelectedInstanceId: selected[0] });
    await this.setState({ contentTypeSelected: '' });
    await this.setState({ SelectedProject: selected[1] });
    await this.setState({ apiUrl: this.state.instanceData[selected[0]].instanceKey.api.apiURL });
    await this.setState({ baseURL: this.state.instanceData[selected[0]].instanceKey.api.baseURL });
    await this.setState({ configdata: this.state.instanceData[selected[0]].configProject.configData });
    await this.setState({ domain: this.state.instanceData[selected[0]].instanceKey.domain });
    await this.setState({ projectIdentifier: selected[2] });
    this.setState({ loaderLoading: false });
    this.setState({ message: '' });
    this.setState({contentTypes:[]});
    let flagHasType = false;
   
    this.state.instanceData[selected[0]].activeProjects.forEach( async (project) => {
      this.log('project',project);
      if(project.project.id == selected[1]){
        flagHasType = true;
        this.setState({contentTypes: project.contentType.contentType});
      }
    });
    
    if(!flagHasType){
    this.log('configdata',this.state.configdata);
      this.setState({contentTypes: this.state.configdata.projectDefaults.contentType});
    }
    this.setState({ cleanUrl: this.generateCleanURL(this.state.url) });
    await this.findDuplicate();
  }
  togglePopup() {
    this.setState({
      showPopup: !this.state.showPopup
    });
  }

  handleChangeValue = (data) => {
    this.setState({ showPopup: data.src });
    this.setState({ image: data.src });
    if (data.index) {
      this.setState({ selectedImage: data.index });
      this.setState({ image: this.state.allImages[Number(data.index)] });
    }
  }
  signinTab(e, selectedUrl) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      this.url = tabs[0].url;
      if (this.url.indexOf(selectedUrl) === -1) {
        chrome.tabs.create({ url: selectedUrl }, () => { });
      }
    });
  }
  authenticate = () => new Promise((resolve) => {
    const authdata = {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    this.getCookies(this.state.apiUrl, '_open_project_session', (cookies) => {
      chrome.cookies.set({ url: this.state.baseURL, name: '_open_project_session', value: cookies });
      fetch(`${this.state.apiUrl}/my_preferences/`, authdata)
        .then((response) => {
          if (response.status === 200) {
            this.setState({ authenticate: true });
          } else {
            this.setState({ isLogin: false });
            this.setState({ showEdit: false });
            this.setState({ showSettings: true });
            this.setState({ authenticate: false });
            chrome.storage.local.clear();
          }
          resolve(response.json());
        }).catch(() => {
          this.setState({ isLogin: false });
          this.setState({ showEdit: false });
          this.setState({ showSettings: true });
          this.setState({ authenticate: false });
          chrome.storage.local.clear();
        });
    });
  });

  handleSubmit(event) {
    event.preventDefault();
    this.setState({ loader: true });
    const params = JSON.stringify({
      subject: this.state.title,
      description: {
        format: 'markdown',
        raw: this.state.summary,
        html: ''
      },
      [this.state.configdata.customFields.sourceUrlField]: this.state.url,
      [this.state.configdata.customFields.cleanUrlField]: this.state.cleanUrl,
      _links: {
        type: {
          href: `/api/v3/types/${this.state.contentTypeSelected}`,
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
    fetch(`${this.state.apiUrl}/projects/${this.state.SelectedProject}/work_packages/`, data)
      .then((response) => {
        if (response.status === 201) {
          // this.setState({ message: 'Saved Successfully.' });
        }
        return response.json();
      }).then((catdata) => {
        const webPackageId = catdata.id;
        this.setState({ taskId: webPackageId });
        if (this.state.isPdf == true) {
          this.toDataUrlPdf(this.state.url, (myBase64) => {
            const fileName = 'Curated_Featured_Image.pdf';
            this.uploadPdf(webPackageId, fileName, myBase64);
          });
        }
        if (this.state.image) {
          this.toDataUrl(this.state.image, (myBase64) => {
            const fileName = 'Curated_Featured_Image.png';
            this.uploadImage(webPackageId, fileName, myBase64);
            if (this.state.parentId) {
              this.createRelation(webPackageId);
            }
          });
        } else {
          this.uploadOgData(webPackageId);
          if (this.state.parentId) {
            this.createRelation(webPackageId);
          }
        }
        if (this.state.favIcon) {
          this.toDataUrl(this.state.favIcon, (base64Content) => {
            const curatedFileName = 'Curated_Source_FavIcon.png';
            this.uploadImage(webPackageId, curatedFileName, base64Content);
          });
        }
        // this.setState({ siteUrl: this.state.siteUrl });
        this.setState({ message: `Saved in ${this.state.domain} as` });
        this.setState({ loader: false });
      });
  }

  createRelation(webPackageId) {
    const params = JSON.stringify({
      _links:
      {
        from: { href: `/api/v3/work_packages/${this.state.parentId}` },
        to: { href: `/api/v3/work_packages/${webPackageId}` }
      },
      type: 'duplicates',
      description: 'This is the same thing.'
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
    fetch(`${this.state.apiUrl}/work_packages/${webPackageId}/relations`, data);
  }
  // eslint-disable-next-line camelcase
  // eslint-disable-next-line class-methods-use-this

  generateJSON(doc) {
    const twitterData = [];
    const twitter = doc.querySelectorAll("meta[property^='twitter']");
    let i = 0;
    for (i = 0; i < twitter.length; i++) {
      twitterData.push({ name: twitter[i].attributes.property.nodeValue, content: twitter[i].attributes.content.nodeValue });
    }
    const metaData = [];
    const curatedMetadata = [];
    this.state.metaData.map((meta, i) => {
      const metaName = meta.name;
      if (metaName.includes('twitter:')) {
        twitterData.push(meta);
      } else {
        curatedMetadata.push(meta);
      }
    });
    metaData.push({ name: 'Curated OpenGraph', content: this.state.ogData });
    metaData.push({ name: 'Curated Twitter', content: twitterData });
    metaData.push({ name: 'Curated Meta Data', content: curatedMetadata });
    this.setState({
      metaData: curatedMetadata,
      twitterTag: twitterData
    });
    const databody = JSON.stringify(metaData);
    this.setState({ metaDataJSON: databody });
  }

  generateCleanURL(url) {
    let urlTemp = url;
    if (this.state.configdata.filterDomain) {
      const filterDomain = this.state.configdata.filterDomain;
      const pathArray = url.split('/');
      const protocol = pathArray[0];
      const host = pathArray[2];
      url = protocol + '//' + host;
      let flag = 0;
      filterDomain.map((domain, i) => {
        if (flag === 0) {
          if (url === domain.name) {
            flag = 1;
            if (urlTemp.indexOf(domain.ignoreFrom) > -1) {
              urlTemp = urlTemp.split(domain.ignoreFrom);
              urlTemp = urlTemp[0];
            }
          }
        }
      });
    }
    this.cleanUrl = urlTemp.replace(/(\?)utm[^&]*(?:&utm[^&]*)*&(?=(?!utm[^\s&=]*=)[^\s&=]+=)|\?utm[^&]*(?:&utm[^&]*)*$|&utm[^&]*/gi, '');
    return this.cleanUrl;
  }

  toDataUrl = (url, callback) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        callback(this.response);
        const img = document.getElementById('img');
        if (img) {
          const urlObj = window.URL || window.webkitURL;
          img.src = urlObj.createObjectURL(this.response);
        }
      }
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  }

  uploadImage(id, fileName, data) {
    const databody = JSON.stringify({ fileName, description: { raw: 'Opengraph Logo!' } });
    this.formBody = new FormData();
    this.formBody.append('metadata', databody);
    this.formBody.append('file', data, 'opengraph-logo.72382e605ce3.png');
    const authdata = {
      method: 'POST',
      body: this.formBody,
      credentials: 'include',
      headers: {
        // 'Authorization': 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(`${this.state.apiUrl}/work_packages/${id}/attachments`, authdata).then((response) => {
      if (response.status === 201) {
        // success
      }
      return response.json();
    }).then((res) => {
      // same function used for fav icon.This checking is to avoid multiple uploads
      if (fileName === 'Curated_Featured_Image.png') {
        this.uploadOgData(id);
      }
    });
  }
  uploadOgData(id) {
    const postMetaData = [{
      name: 'openGraphMetaData',
      content: this.state.ogData
    },
    {
      name: 'twitterMetaData',
      content: this.state.twitterTag ? this.state.twitterTag : []
    }, {
      name: 'htmlMetaData',
      content: this.state.metaData
    }, {
      name: 'rssFeedsData',
      content: this.state.rssFeed
    }, {
      name: 'extractedKeywords',
      content: this.state.extractedKeyWords
    }, {
      name: 'pubMedMedlinesSimilarArticles',
      content: this.state.meshData
    }];
    const uploadFileName = 'Lectio_Extension_Curation.json';
    if (this.state.isPdf) {
      const tempObject = {
        name: 'pdfMetaData',
        content: this.state.pdfMetaData ? this.state.pdfMetaData : []
      };
      postMetaData.push(tempObject);
    }
    const metaData = new Blob([JSON.stringify(postMetaData)], { type: 'application/json' });
    const fr = new FileReader();
    fr.readAsText(metaData);
    const databody = JSON.stringify({ fileName: uploadFileName, description: { raw: 'Lectio Extension Curation' } });
    const formBody = new FormData();
    formBody.append('metadata', databody);
    formBody.append('file', metaData, uploadFileName);
    const authdata = {
      method: 'POST',
      body: formBody,
      credentials: 'include',
      headers: {
        // 'Authorization': 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(`${this.state.apiUrl}/work_packages/${id}/attachments`, authdata).then((response) => {
      if (response.status === 201) {
        // this.setState({ message: 'Saved Successfully.' });
      }
      return response.json();
    }).then((res) => {
      this.uploadReadableContent(id);
    });
  }
  uploadReadableContent(id) {
    const readableContent = new Blob([JSON.stringify(this.state.mozilaReadability)], { type: 'application/json' });
    const fr = new FileReader();
    fr.readAsText(readableContent);
    const databody = JSON.stringify({ fileName: 'Curated_Readable_Content.json', description: { raw: 'Readable Contents' } });
    const formBody = new FormData();
    formBody.append('metadata', databody);
    formBody.append('file', readableContent, 'Curated_Readable_Content.json');
    const authdata = {
      method: 'POST',
      body: formBody,
      credentials: 'include',
      headers: {
        // 'Authorization': 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(`${this.state.apiUrl}/work_packages/${id}/attachments`, authdata).then((response) => {
      if (response.status === 201) {
        // this.setState({ message: 'Saved Successfully.' });
      }
      return response.json();
    }).then((res) => {
      if (String(this.state.domContents) !== String(this.state.domInitial)) {
        this.uploadReadableHtml(id);
      }
    });
  }
  uploadReadableHtml(id) {
    const readableHtml = new Blob([this.state.domContents], { type: 'plain/text' });
    const fr = new FileReader();
    fr.readAsText(readableHtml);
    const databody = JSON.stringify({ fileName: 'Curated_Readable_Content_Edited.html', description: { raw: 'Readable Content HTML' } });
    const formBody = new FormData();
    formBody.append('metadata', databody);
    formBody.append('file', readableHtml, 'Curated_Readable_Content_Edited.html');
    const authdata = {
      method: 'POST',
      body: formBody,
      credentials: 'include',
      headers: {
        // 'Authorization': 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(`${this.state.apiUrl}/work_packages/${id}/attachments`, authdata);
  }
  contentChange = (changeData) => {
    this.setState({ domContents: changeData });
  }
  shareDataChange = (changeData) => {
    if (changeData.key === 'mesh') {
      this.setState({ meshData: changeData.data });
    } else if (changeData.key === 'keyWords') {
      this.setState({ extractedKeyWords: changeData.data });
    }
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
    if (this.state.contentTypeSelected) {
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
    } else if (String(event.target.id) === 'settingsTab') {
      showSettingsTab = true;
    } else {
      editTab = true;
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
    chrome.cookies.get({ url: domain, name }, (cookie) => {
      if (callback) {
        if (cookie) {
          this.coockieValue = cookie.value;
          callback(this.coockieValue);
        } else {
          callback(null);
        }
      }
    });
  }
  async loadConfig() {
    const resp = await this.ConfigLoader.loadConfig();
    this.log('responose lodaconfig', resp);
    this.setState({ instanceData: resp });
    if (resp === false) {
      this.setState({ isLogin: false });
    } else {
      this.setState({ authenticate: true });
    }
    this.needToLogin = await this.ConfigLoader.needToLogin();
    return resp;
    // expected output: 'resolved'
  }
  isPdfLink(url) {
    return new Promise(((resolve, reject) => {
      fetch(url).then((response) => {
        const contentType = response.headers.get('content-type');
        if (contentType === 'application/pdf') {
          resolve('pdf');
        } else {
          resolve('html');
        }
      });
    }));
  }
  metadataReading(url) {
    const loadingTask = pdf.getDocument(url);
    loadingTask.promise.then((pdfDoc_) => {
      const pdfDoc = pdfDoc_;
      pdfDoc.getMetadata().then((stuff) => {
        if (stuff) {
          this.setState({
            title: stuff.info.Title ? stuff.info.Title : '',
            fetchingContents: false,
            summary: stuff.info.subject ? stuff.info.subject : '',
            pdfMetaData: stuff.metadata
          });
        }
        this.setState({ isPdf: true });
      }).catch((err) => {
        console.log(err);
      });
    });
  }
  uploadPdf(id, fileName, data) {
    const databody = JSON.stringify({ fileName, description: { raw: 'Opengraph Logo!' } });
    this.formBody = new FormData();
    this.formBody.append('metadata', databody);
    this.formBody.append('file', data, 'opengraph-logo.72382e605ce3.pdf');
    const authdata = {
      method: 'POST',
      body: this.formBody,
      credentials: 'include',
      headers: {
        // 'Authorization': 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(`${this.state.apiUrl}/work_packages/${id}/attachments`, authdata);
  }
  toDataUrlPdf = (url, callback) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        callback(this.response);
        const pdf = document.getElementById('img');
        if (pdf) {
          // const urlObj = window.URL || window.webkitURL;
          // img.src = urlObj.createObjectURL(this.response);
        }
      }
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  }
  replaceWithReadableContent() {
    if (!this.state.isPdf) {
      this.setState({ summary: this.state.readabilityContent });
    }
  }
  replaceWithReadableContentAndMeta() {
    if (!this.state.isPdf) {
      let domData = `<b>Title: </b>${this.state.readabilityTitle}<br>`;
      domData = `${domData}<b>Excerpt: </b>${this.state.readabilityExcerpt}<br>`;
      if (this.state.readabilityByline) {
        domData = `${domData}<b>Byline: </b>${this.state.readabilityByline}<br>`;
      }
      domData += this.state.readabilityContent;
      this.setState({ summary: domData });
    }
  }
  clearImage() {
    if (!this.state.isPdf) {
      this.setState({ image: '' });
    }
  }
  clearContent() {
    if (!this.state.isPdf) {
      this.setState({ summary: '' });
    }
  }
  appendReadableContent() {
    if (!this.state.isPdf) {
      let currentContent = this.state.summary;
      currentContent = `${currentContent}<br><br>${this.state.domContents}`;
      this.setState({
        summary: currentContent
      });
    }
  }

  async recurProj(InstanceIndex,projects,level = 1,ar = []) {
    // this.log('project',projects);
    projects.forEach(async (data) => {
      let spac = '';
      for(let i=0; i<= level; i += 1){
        spac += '\u00A0\u00A0';
      }
      if(data.type === 'parent'){
        ar.push(<optgroup className={style.InstanceOptGroup} label={spac + data.name} />)
      }else{
        await ar.push(<option key={`${InstanceIndex}--${data.id}--${data.identifier}`} value={`${InstanceIndex}--${data.id}--${data.identifier}`}>{spac + data.name}</option>);
      }
      // this.log('name',data.name);
      // this.log('level',level);
      if (typeof data.child !== 'undefined') {
        return this.recurProj(InstanceIndex,data.child,level + 1,ar);
      }
      return ar;
    });
    
  }

  renderProjectList() {
    let ar = [];
    // this.log('instanceData',this.state.instanceData);
    this.state.instanceData.forEach(async (instance, InstanceIndex) => {
      ar.push(<optgroup className={style.InstanceOptGroup} label={instance.instanceKey.extensionUI.displayName} />);
      // {
      //   instance.activeProjects.map((project, ProjectIindex) => {
      //   ar.push(<option key={`${InstanceIndex}--${ProjectIindex}--${project.project.id}--${project.project.identifier}`} value={`${InstanceIndex}--${ProjectIindex}--${project.project.id}--${project.project.identifier}`}>&nbsp;{project.project.name}</option>);
      //   });
      // }
      if (typeof instance.configProject.configData.projects !== 'undefined') {
        // this.log('call project', instance.instanceKey.extensionUI.displayName);
      ar = await this.recurProj(InstanceIndex,instance.configProject.configData.projects,1,ar);
      }
    });
    this.needToLogin.forEach((instance, InstanceIndex) => {
      ar.push(<optgroup className={style.InstanceOptGroup} label={instance.extensionUI.displayName + ' (Need to Login)'} />);
    });
    return ar;
  }
  render() {
    return (
      <section className={style.sectionContent} >
        {
          this.state.isLogin ? <div className="ds-l-container">
            <div className="ds-l-row">
              {this.state.fetchingContents ? <div className="ds-u-padding--0 ds-l-col--11"><p className="ds-u-text-align--center">
                <button className="ds-c-button">
                  <span className="ds-c-spinner ds-c-spinner--small" aria-valuetext="Fetching Contents" role="progressbar" /> Fetching Contents
                </button>
              </p></div> : <div className="ds-u-padding--0 ds-l-col--11">
                  {this.state.showEdit ?
                    <div id="panel-edit">
                      <form onSubmit={this.handleSubmit} id="homePageForm">
                        <div className="ds-l-row ds-u-padding-top--1 ds-u-padding-left--0 ds-u-padding-right--0">
                          <div className="ds-l-col--12">
                            <textarea className={this.state.title ? [style.textareaTitle, 'preview__label ds-u-font-size--h4 ds-u-font-style--normal'].join(' ') : [style.titleError, 'ds-u-font-size--base ds-u-font-style--normal'].join(' ')} value={this.state.title} onChange={this.handleChange} placeholder="Title *" />
                          </div>
                        </div>
                        <div className="ds-l-row">
                          <div className="ds-l-col--12 preview__label ds-u-font-size--small ds-u-font-style--normal">
                            <CKEditor
                              editor={ClassicEditor}
                              config={{
                                toolbar: ['heading', 'bold', 'italic', 'link', 'undo', 'redo', 'bulletedList', 'numberedList', 'blockQuote']
                              }}
                              data={this.state.summary}
                              onInit={(editor) => {
                                editor.setData(this.state.summary);
                              }}
                              onChange={(event, editor) => {
                                const data = editor.getData();
                                this.setState({ summary: data });
                              }}
                            />
                          </div>
                        </div>
                        <div className="ds-l-row ds-u-padding-right--1">
                          <div className="ds-l-col--8">
                            <ul className={[style.readableContentUl, 'ds-c-list ds-u-padding-left--3 ds-u-margin--0'].join(' ')} aria-labelledby="unordered-list-id">
                              <li className="ds-u-margin--0"><a className="ds-u-color--muted" href="#" onClick={this.replaceWithReadableContent}>Replace with Readable Content</a></li>
                              <li className="ds-u-margin--0"><a className="ds-u-color--muted" href="#" onClick={this.replaceWithReadableContentAndMeta}>Replace with Readable Content & Meta data</a></li>
                              <li className="ds-u-margin--0"><a className="ds-u-color--muted" href="#" onClick={this.appendReadableContent}>Append Readable Content</a></li>
                              <li className="ds-u-margin--0"><a className="ds-u-color--muted" href="#" onClick={this.clearContent}>Clear Content</a></li>
                              <li className="ds-u-margin--0"><a className="ds-u-color--muted" href="#" onClick={this.clearImage}>Clear Image</a></li>
                            </ul>
                          </div>
                          <div className="ds-l-col--4">
                            {this.state.image.length > 0 ?
                              <img id="imgTab" onClick={this.activateTabs} src={this.state.image} className={style.ogImage} alt="" />
                              : null}
                            {this.state.isPdf ?
                              <img src={pdfImage} alt="pdf" height="42" width="42" /> : null}
                          </div>
                        </div>
                        <hr className="on ds-u-fill--gray-lightest" />
                        <div className="ds-l-row ds-u-margin-left--0">
                          <div className={[style.favIcon, 'ds-l-col--auto'].join(' ')}>{this.state.favIcon ? <img src={this.state.favIcon} width="18px" height="18px" alt="favIcon" /> : null}</div>
                          <div className={[style.cleanUrl, 'ds-l-col--10 ds-u-padding-x--0'].join(' ')}><input type="text" className={this.state.parentId ? [style.textareaLink, 'preview__label ds-u-font-style--normal ds-u-color--white on ds-u-fill--secondary-dark ds-u-padding-x--1'].join(' ') : [style.textareaLink, 'preview__label ds-u-font-style--normal'].join(' ')} value={this.state.cleanUrl} onChange={this.handleUrl} style={this.state.parentId ? { height: '20px' } : { height: '18px' }} /></div>
                        </div>
                        <hr className="on ds-u-fill--gray-lightest ds-u-margin-bottom--0" />
                        <div className="ds-l-row">
                          <div className="ds-l-col--6">
                          <select className={this.state.projectSelected ? 'ds-c-field ds-u-font-size--small ds-u-font-style--normal ds-u-border--1 ds-u-margin-bottom--0 ds-u-padding-left--2' : [style.titleError, 'ds-c-field ds-u-font-size--small ds-u-font-style--normal ds-u-margin-bottom--0 ds-u-padding-left--2'].join(' ')} value={this.state.projectSelected} onChange={this.handleProjectChange} style={{minWidth:'237px'}}>
                            <option value="">In</option>
                            {/* {this.state.contentType.map(type => <option key={type.id} value={type.id}>{type.name}</option>)} */}
                            {this.renderProjectList()}
                          </select>
                          </div>
                          <div className="ds-l-col--6">
                          <select className={this.state.contentTypeSelected ? 'ds-c-field ds-u-font-size--small ds-u-font-style--normal ds-u-border--1 ds-u-margin-bottom--0 ds-u-padding-left--2' : [style.titleError, 'ds-c-field ds-u-font-size--small ds-u-font-style--normal ds-u-margin-bottom--0 ds-u-padding-left--2'].join(' ')} value={this.state.SelectedInstance} onChange={this.handleTypeChange}>
                            <option value="">As</option>
                           {this.state.contentTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}                            
                          </select>
                          </div>
                        </div>

                        <hr className="on ds-u-fill--gray-lightest ds-u-margin-bottom--0" />
                        <div className={style.sucessBlock}>
                          {this.state.loader ? <button className="ds-u-margin-left--1 ds-u-margin-top--1 ds-c-button ds-c-button--primary">
                            <span className="ds-c-spinner ds-c-spinner--small ds-c-spinner--inverse" aria-valuetext="Saving" role="progressbar" /> Saving
                        </button> : null}
                          {this.state.loaderLoading ? <button className="ds-u-margin-left--1 ds-u-margin-top--1 ds-c-button ds-c-button--primary">
                            <span className="ds-c-spinner ds-c-spinner--small ds-c-spinner--inverse" aria-valuetext="Saving" role="progressbar" /> Loading
                        </button> : null}
                          {this.state.message === '' && this.state.loader === false ?
                            <div className="ds-l-row">
                              <div className="ds-l-col--auto">
                                <input disabled={!this.state.title || !this.state.contentTypeSelected} type="submit" value="Post to Lectio" className="ds-u-margin-left--1 ds-u-margin-top--1 ds-c-button ds-c-button--primary" /></div>
                              <div className="ds-l-col--auto">
                                {this.state.parentId ? <a className="ds-u-margin-top--1 preview__label ds-u-font-size--base ds-u-font-style--normal" target="_blank" href={`${this.state.domain}/projects/${this.state.projectIdentifier}/work_packages/${this.state.parentId}/activity`}>{this.state.duplicateMessage}</a> : null}</div>
                            </div> : null}
                          {this.state.message !== '' ?
                            <div className="ds-c-alert ds-c-alert--success">
                              <div className="ds-c-alert__body">
                                <p className="ds-c-alert__text">{this.state.message} <a target="_blank" href={`${this.state.domain}/projects/${this.state.projectIdentifier}/work_packages/${this.state.taskId}`} rel="noopener noreferrer">{this.state.taskId ? `#${this.state.taskId}` : null}</a></p>
                              </div>
                            </div> : null}
                        </div>
                      </form>
                    </div>
                    : null}
                  {this.state.showJsonTree ? <div id="panel-meta">
                    <ExtractedContent jsonData={this.state.metaDataJSON} rssFeed={this.state.rssFeed} articleTitle={this.state.readabilityTitle} articleExcerpt={this.state.readabilityExcerpt} articleByline={this.state.readabilityByline} articleData={this.state.domContents} onContentChange={this.contentChange} />
                  </div> : null}
                  {this.state.showShare ? <div id="panel-share">
                    <ShareContent configdata={this.state.configdata} domContents={this.state.domContents} metaData={this.state.metaData} onContentChange={this.shareDataChange} />
                  </div> : null}
                  {this.state.showAttachmentTab ? <div id="panel-attachment"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
                  {this.state.showImgTab ? <div id="panel-img"><Popup
                    text="Close"
                    closePopup={this.togglePopup.bind(this)}
                    images={this.state.allImages}
                    selectedImage={this.state.selectedImage}
                    onChangeValue={this.handleChangeValue}
                    configdata={this.state.configdata}
                    apiUrl={this.state.apiUrl}
                    baseUrl={this.state.baseURL}
                  />
                  </div> : null}
                  {this.state.showMsgTab ? <div id="panel-msg"><Feedback configdata={this.state.configdata} apiUrl={this.state.apiUrl} siteUrl={this.state.baseURL} cleanUrl={this.state.cleanUrl} /></div> : null}
                  {this.state.showNotificationTab ? <div id="panel-notification"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
                  {this.state.showSettings ? <div id="panel-notification">
                    <section className="ds-u-margin--1 ds-u-border--2 preview__label ds-u-font-style--normal ds-l-container ds-u-font-size--base">
                      <div className="ds-l-row ds-u-padding-top--1">
                        <div className="ds-l-col">
                          Name : Lectio
                      </div>
                      </div>
                      <div className="ds-l-row ds-u-padding-top--1 ds-u-padding-bottom--1">
                        <div className="ds-l-col">
                          Version : {this.manifestData.version}
                        </div>
                      </div>
                    </section>
                    <section className="ds-u-margin--1 preview__label ds-u-font-style--normal ds-l-container ds-u-font-size--base">
                      <div className="ds-u-text-align--center ds-u-margin-top--4">
                        {this.needToLogin.map((value, index) => <div claasName="ds-l-row"><div className="ds-l-col ds-u-margin-bottom--1">
                          <a className="ds-c-button ds-c-button--small ds-c-button--primary" href="#" onClick={e => this.signinTab(e, value.domain)} style={{minWidth:'300px'}} >Sign in to {value.extensionUI.displayName}</a></div></div>)}
                      </div>
                    </section>
                  </div> : null}
                </div>}

              <div className={[style.sideBar, 'ds-u-padding--0 ds-l-col--1 ds-u-border-left--1'].join(' ')}>
                <div>
                  <div>
                    <ul className={[style.verticalNavCustom, 'ds-c-vertical-nav'].join(' ')}>
                      <li className={this.state.showEdit ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showEdit ? [style.editActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.editInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="editTab" />
                      </li>
                      <li className={this.state.showJsonTree ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showJsonTree ? [style.metaActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.metaInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="jsonTree" style={!this.state.contentTypeSelected ? { cursor: 'not-allowed', opacity: '0.2' } : null} />
                      </li>
                      <li className={this.state.showImgTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showImgTab ? [style.imgActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.imgInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="imgTab" style={!this.state.contentTypeSelected ? { cursor: 'not-allowed', opacity: '0.2' } : null} />
                      </li>
                      <li className={this.state.showShare ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showShare ? [style.shareActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.shareInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="shareTab" style={!this.state.contentTypeSelected ? { cursor: 'not-allowed', opacity: '0.2' } : null} />
                      </li>
                      <li className={this.state.showNotificationTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showNotificationTab ? [style.notificationActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.notificationInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="notificationTab" style={!this.state.contentTypeSelected ? { cursor: 'not-allowed', opacity: '0.2' } : null} />
                      </li>
                      <li className={this.state.showAttachmentTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showAttachmentTab ? [style.attachmentActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.attachmentInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="attachmentTab" style={!this.state.contentTypeSelected ? { cursor: 'not-allowed', opacity: '0.2' } : null} />
                      </li>
                      <li className={this.state.showMsgTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showMsgTab ? [style.messageActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.messageInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="msgTab" style={!this.state.contentTypeSelected ? { cursor: 'not-allowed', opacity: '0.2' } : null} />
                      </li>
                      <li className={this.state.showSettings ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showSettings ? [style.settingsActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.settingsInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="settingsTab" />
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
                You are not authenticated yet, <br />please log into a Lectio instance.
            </div>
              <hr className="on ds-u-fill--gray-lightest" />
              <div className="ds-u-text-align--center ds-u-margin-top--4">
                {this.state.allDomains.map((value, index) => <div claasName="ds-l-row"><div className="ds-l-col ds-u-margin-bottom--1">
                  <a className="ds-c-button ds-c-button--small ds-c-button--primary" href="#" onClick={e => this.signinTab(e, value.domain)} style={{ width: '65%' }}>Sign in to {value.domainName}</a></div></div>)}
                <div className="ds-u-font-style--italic ds-u-margin-top--4 ds-u-margin-bottom--2">
                  After you’ve signed in, <br />please click the extension button again.
              </div>
              </div>
            </div>
        }
      </section>
    );
  }
}

