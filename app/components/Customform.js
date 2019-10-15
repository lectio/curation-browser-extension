import React, { Component } from 'react';
import style from './CustomForm.css';
import ExtractedContent from './ExtractedContent';
import Feedback from './Feedback';
import Popup from './Popup';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import * as APIDATA from '../constants/apidata';
import logo from '../../chrome/assets/img/logo-small.png';
import pdfImage from '../../chrome/assets/img/edit-pdf.png';
import * as INSTANCE from '../constants/config.json';
import * as pdf from 'pdfjs-dist';

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
      contentType: [],
      contentTypeSelected: '',
      doc: '',
      domInitial: '',
      autoClassificationData: [],
      showAutoClassificationTab: false,
      mozilaReadability: '',
      isPdf: false,
      readabilityTitle: '',
      readabilityExcerpt: '',
      readabilityByline: '',
      readabilityContent: '',
      initialSummary: '',
      twitterTag: ''
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSummary = this.handleSummary.bind(this);
    this.handleUrl = this.handleUrl.bind(this);
    this.activateTabs = this.activateTabs.bind(this);
    this.saveSetting = this.saveSetting.bind(this);
    this.authenticate = this.authenticate.bind(this);
    this.signinTab = this.signinTab.bind(this);
    this.checkURL = this.checkURL.bind(this);
    this.getCookies = this.getCookies.bind(this);
    this.getMeshData = this.getMeshData.bind(this);
    this.contentChange = this.contentChange.bind(this);
    this.metadataReading = this.metadataReading.bind(this);
    this.isPdfLink = this.isPdfLink.bind(this);
    this.replaceWithReadableContent = this.replaceWithReadableContent.bind(this);
    this.replaceWithReadableContentAndMeta = this.replaceWithReadableContentAndMeta.bind(this);
    this.clearImage = this.clearImage.bind(this);
    this.clearContent = this.clearContent.bind(this);
    this.appendReadableContent = this.appendReadableContent.bind(this);
  }
  componentDidMount() {
    this.authenticate();
    if (this.state.isLogin) {
      this.getExtLocalConfig();
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
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
              this.findDuplicate();
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
                this.generateJSON(doc);
                if (x.readyState === 4) {
                  if (x.status === 200) {
                    this.findDuplicate();
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
                this.getMeshData();
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
  checkURL(url) {
    return (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
  }
  setAllImages(images) {
    const srcList = [];
    if (this.state.image) {
      srcList.push(this.state.image);
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

  findDuplicate() {
    const cleanUrl = this.state.cleanUrl;
    const filterByCleanUrl = `filters=[{"${APIDATA.cleanUrlField}":{"operator":"~","values":["${encodeURIComponent(cleanUrl)}"]}}]`;
    const filterData = {
      method: 'GET',
      credentials: 'include',
      headers: {
        // Authorization: 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/projects/${APIDATA.PROJECT_ID}/work_packages/?${filterByCleanUrl}`, filterData)
      .then(response => response.json()).then((responseData) => {
        if (typeof (responseData._embedded) !== 'undefined') {
          const duplicateElements = responseData._embedded.elements;
          let duplicateMsg = '';
          if (duplicateElements.length > 0) {
            const lowest = duplicateElements[0].id;
            this.setState({ fetchingContents: false });
            duplicateMsg = `Clean URL duplicate of # ${lowest}`;
            this.setState({ parentId: lowest, duplicateMessage: duplicateMsg });
          } else {
            const filterBySourceUrl = `filters=[{"${APIDATA.sourceUrlField}":{"operator":"~","values":["${encodeURIComponent(this.state.url)}"]}}]`;
            fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/projects/${APIDATA.PROJECT_ID}/work_packages/?${filterBySourceUrl}`, filterData)
              .then(res => res.json()).then((resData) => {
                this.setState({ fetchingContents: false });
                if (typeof (resData._embedded) !== 'undefined') {
                  const duplicateElements = resData._embedded.elements;
                  if (duplicateElements.length > 0) {
                    const lowest = duplicateElements[0].id;
                    duplicateMsg = `Source URL duplicate of # ${lowest}`;
                    this.setState({ parentId: lowest, duplicateMessage: duplicateMsg });
                  }
                }
              });
          }
        }
      });
  }

  getMeshData = (e) => {
    const x = new XMLHttpRequest();
    x.open('POST', 'https://meshb.nlm.nih.gov/api/MOD');
    x.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    x.responseType = 'json';
    x.onload = (e) => {
      e.preventDefault();
      const doc = x.response;
      if (doc.body) {
        try {
          this.setState({ autoClassificationData: { meshData: JSON.parse(doc.body) } });
          this.setState({ meshData: JSON.parse(doc.body) });
          this.setState({ showAutoClassificationTab: true });
        } catch (error) { }
      }
    };
    x.onerror = (e) => {
      throw e;
    };
    const text = striptags(this.state.domContents, [], '\n');
    x.send(JSON.stringify({ input: text }));
  }
  handleChange(event) {
    this.setState({ title: event.target.value });
  }
  handleUrl(event) {
    this.setState({ cleanUrl: event.target.value });
  }
  handleSummary(event) {
    this.setState({ summary: event.target.value });
  }
  handleContentType(event) {
    this.setState({ contentTypeSelected: event.target.value });
  }
  handleApikey = (e) => {
    this.setState({ apiKey: e.target.value });
  }
  handleBaseUrl = (e) => {
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
    fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/my_preferences/`, authdata)
      .then((response) => {
        if (response.status === 200) {
          const obj = {};
          obj.apiKey = this.state.apiKey;
          obj.baseUrl = this.state.baseUrl;
          chrome.storage.local.set(obj);
          this.setState({ messageApiKey: 'ApiKey Saved Successfully.' });
          this.setState({ messageApiKeyErr: '' });
        } else {
          this.setState({ messageApiKeyErr: 'Invalid API Key.' });
          this.setState({ messageApiKey: '' });
        }
        return response.json();
      }).catch((response) => {
        this.setState({ messageApiKeyErr: 'Invalid API Key / Base Url.' });
        this.setState({ messageApiKey: '' });
      });
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
  signinTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      this.url = tabs[0].url;
      if (this.url.indexOf(APIDATA.BASE_URL) === -1) {
        chrome.tabs.create({ url: APIDATA.BASE_URL }, () => { });
      }
    });
  }
  setConfigVal = () => new Promise(((resolve) => {
    Object.keys(INSTANCE).forEach((key) => {
      // eslint-disable-next-line no-console
      if (key === APIDATA.DOMAIN_NAME) {
        const obj = {};
        obj.config = INSTANCE[key];
        chrome.storage.local.set(obj);
      }
    });

    chrome.storage.local.get('config', async (items) => {
      resolve(items.config);
    });
  }));

  getExtLocalConfig = async () => {
    const config = await this.setConfigVal();
    this.setState({ extLocalConfigName: config.projects.dynamicConfig.extnLocalConfig });
    const jsData = await fetch(`/extLocalConfig/${config.projects.dynamicConfig.extnLocalConfig}`).then(response => response.json()).then((responsoData) => {
      this.setState({ extConfig: responsoData });
      this.setState({ contentType: responsoData.contentType[0].workPackage });
      // this.setState({ contentTypeSelected: responsoData.contentType[0].workPackage[0].id });
    }).catch((e) => {
      console.log('Json error', e);
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
    this.getCookies(APIDATA.BASE_URL, '_open_project_session', (cookies) => {
      chrome.cookies.set({ url: APIDATA.BASE_URL, name: '_open_project_session', value: cookies });
      fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/my_preferences/`, authdata)
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
      [APIDATA.sourceUrlField]: this.state.url,
      [APIDATA.cleanUrlField]: this.state.cleanUrl,
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
    fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/projects/${APIDATA.PROJECT_ID}/work_packages/`, data)
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
        this.setState({ siteUrl: APIDATA.SITE_URL });
        this.setState({ message: `Saved in ${APIDATA.DOMAIN_NAME} as` });
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
    fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/work_packages/${webPackageId}/relations`, data);
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
    if (url.indexOf('?ec=') > -1) {
      urlTemp = url.split('?ec=');
      urlTemp = urlTemp[0];
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
    fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/work_packages/${id}/attachments`, authdata).then((response) => {
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
    let postMetaData = [{
      name: 'openGraphMetaData',
      content: this.state.ogData
    },
    {
      name: 'twitterMetaData',
      content: this.state.twitterTag
    }, {
      name: 'htmlMetaData',
      content: this.state.metaData
    }, {
      name: 'pubMedMedlinesSimilarArticles',
      content: this.state.meshData
    }];
    let uploadFileName = 'Lectio_Extension_Curation.json';
    if (this.state.isPdf) {
      uploadFileName = 'Curated PDF Meta Data.json';
      postMetaData = this.state.pdfMetaData ? this.state.pdfMetaData : [];
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
    fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/work_packages/${id}/attachments`, authdata).then((response) => {
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
    fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/work_packages/${id}/attachments`, authdata).then((response) => {
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
    fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/work_packages/${id}/attachments`, authdata);
  }
  contentChange = (changeData) => {
    this.setState({ domContents: changeData });
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
          this.setState({ title: stuff.info.Title ? stuff.info.Title : '',
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
    fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/work_packages/${id}/attachments`, authdata);
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
                            <img id="imgTab" onClick={this.activateTabs} src={this.state.image} className={style.ogImages} alt="" />
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
                      <div className="ds-l-row"><div className="ds-l-col--12"><select className={this.state.contentTypeSelected ? 'ds-c-field ds-u-font-size--small ds-u-font-style--normal ds-u-border--1 ds-u-margin-bottom--0 ds-u-padding-left--2' : [style.titleError, 'ds-c-field ds-u-font-size--small ds-u-font-style--normal ds-u-margin-bottom--0 ds-u-padding-left--2'].join(' ')} value={this.state.contentTypeSelected} onChange={e => this.setState({ contentTypeSelected: e.target.value })}>
                        <option value="">Select</option>
                        {this.state.contentType.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                      </select></div></div>

                      <hr className="on ds-u-fill--gray-lightest ds-u-margin-bottom--0" />
                      <div className={style.sucessBlock}>
                        {this.state.loader ? <button className="ds-u-margin-left--1 ds-u-margin-top--1 ds-c-button ds-c-button--primary">
                          <span className="ds-c-spinner ds-c-spinner--small ds-c-spinner--inverse" aria-valuetext="Saving" role="progressbar" /> Saving
                        </button> : null}
                        {this.state.message === '' && this.state.loader === false ?
                          <div className="ds-l-row">
                            <div className="ds-l-col--auto">
                              <input disabled={!this.state.title || !this.state.contentTypeSelected} type="submit" value="Post to Lectio" className="ds-u-margin-left--1 ds-u-margin-top--1 ds-c-button ds-c-button--primary" /></div>
                            <div className="ds-l-col--auto">
                              {this.state.parentId ? <a className="ds-u-margin-top--1 preview__label ds-u-font-size--base ds-u-font-style--normal" target="_blank" href={`${APIDATA.BASE_URL + APIDATA.SITE_URL + this.state.parentId}/activity`}>{this.state.duplicateMessage}</a> : null}</div>
                          </div> : null}
                        {this.state.message !== '' ?
                          <div className="ds-c-alert ds-c-alert--success">
                            <div className="ds-c-alert__body">
                              <p className="ds-c-alert__text">{this.state.message} <a target="_blank" href={APIDATA.BASE_URL + APIDATA.SITE_URL + this.state.taskId} rel="noopener noreferrer">{this.state.taskId ? `#${this.state.taskId}` : null}</a></p>
                            </div>
                          </div> : null}
                      </div>
                    </form>
                  </div>
                  : null}
                {this.state.showJsonTree ? <div id="panel-meta">
                  <ExtractedContent jsonData={this.state.metaDataJSON} articleTitle={this.state.readabilityTitle} articleExcerpt={this.state.readabilityExcerpt} articleByline={this.state.readabilityByline} articleData={this.state.domContents} onContentChange={this.contentChange} />
                </div> : null}
                {this.state.showShare ? <div id="panel-share">
                  <div className="usa-accordion site-accordion-code">
                    <h4 className="usa-accordion__heading site-accordion-code">
                      <button
                        className="usa-accordion__button"
                        aria-expanded="true"
                        aria-controls="metaDataContent"
                      >
                          Auto Classification
                      </button>
                    </h4>
                    {this.state.showAutoClassificationTab ?
                      <div id="metaDataContent" className="usa-accordion__content usa-prose">
                        <div className="ds-u-margin-left--1 preview__label ds-u-font-style--normal" style={{ height: '500px' }}>
                          <h4>NIH Medical Subjects Heading (MeSH)</h4>
                          {this.state.autoClassificationData.meshData.MoD_Raw.Term_List.map(type => <div><label><input type="checkbox" value={type.term} /><span className="ds-u-padding-left--1" >{type.Term}</span>
                          </label></div>)
                          }
                        </div>
                      </div>
                      :
                      <button className="ds-u-margin--1 ds-c-button ds-c-button--primary">
                        <span className="ds-c-spinner ds-c-spinner--small ds-c-spinner--inverse" aria-valuetext="Fetching classifications from NIH Medical Subject Headings (MeSH)" role="progressbar" /> Fetching classifications from NIH Medical Subject Headings (MeSH)
                      </button>
                    }
                  </div>
                </div> : null}
                {this.state.showAttachmentTab ? <div id="panel-attachment"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
                {this.state.showImgTab ? <div id="panel-img"><Popup
                  text="Close"
                  closePopup={this.togglePopup.bind(this)}
                  images={this.state.allImages}
                  selectedImage={this.state.selectedImage}
                  onChangeValue={this.handleChangeValue}
                />
                </div> : null}
                {this.state.showMsgTab ? <div id="panel-msg"><Feedback siteUrl={this.state.url} cleanUrl={this.state.cleanUrl} /></div> : null}
                {this.state.showNotificationTab ? <div id="panel-notification"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
                {this.state.showSettings ? <div id="panel-notification">
                  <p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p>
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
                        <a className={this.state.showJsonTree ? [style.metaActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.metaInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="jsonTree" />
                      </li>
                      <li className={this.state.showImgTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showImgTab ? [style.imgActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.imgInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="imgTab" />
                      </li>
                      <li className={this.state.showShare ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showShare ? [style.shareActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.shareInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="shareTab" />
                      </li>
                      <li className={this.state.showNotificationTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showNotificationTab ? [style.notificationActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.notificationInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="notificationTab" />
                      </li>
                      <li className={this.state.showAttachmentTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showAttachmentTab ? [style.attachmentActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.attachmentInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="attachmentTab" />
                      </li>
                      <li className={this.state.showMsgTab ? [style.verticalNavCustomActive, 'ds-c-vertical-nav__item'].join(' ') : 'ds-c-vertical-nav__item'} onClick={this.activateTabs}>
                        <a className={this.state.showMsgTab ? [style.messageActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ') : [style.messageInActive, style.sidebarIcons, 'ds-c-vertical-nav__label ds-u-padding--0'].join(' ')} href="#" id="msgTab" />
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
                You are not authenticated yet, <br />please log in to continue.
            </div>
            <hr className="on ds-u-fill--gray-lightest" />
            <div className="ds-u-text-align--center ds-u-margin-top--4">
              <div claasName="ds-u-margin-top--4"><a className="ds-c-button ds-c-button--primary" onClick={this.signinTab} >Sign in</a></div>
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

