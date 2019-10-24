/* eslint-disable no-underscore-dangle */
import React from 'react';
import INSTANCE from '../constants/config.json';
import APIDATA from '../constants/apidata';

const yaml = require('js-yaml');

export default class ConfigLoader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      authdataGet: { method: 'GET', credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } },
      authdataPost: { method: 'POST', credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest', 'content-type': 'application/json' } },
      loading: false,
      configData: [],
      instanceData: [],
      needToLogin : [],
      instanceConfigProject: [],
      configProject:[],
      OtherProjects:[],
      newinstanceConfigProject:[]
    };
    this.loadConfig = this.loadConfig.bind(this);
    this.checkLogedInstance = this.checkLogedInstance.bind(this);
    this.getInstanceConfigData = this.getInstanceConfigData.bind(this);
  }


  // eslint-disable-next-line react/sort-comp
  loadConfig = () => new Promise((resolve) => {
    this.checkLogedInstance().then(async (isLogedIn) => {
      this.log('isLogedIn', isLogedIn);
      if (isLogedIn === true) {
        this.log('isLogedIn Inside', isLogedIn);
        await this.getInstances();
        const newInstance = await this.getInstanceConfigData();
        const getProjects = await this.getProjectsWithConfig(newInstance);
        // const getConfigInstanceDat = await this.getConfigInstanceConfig(getProjects);
        // await this.getInstanceConfig().then( (InstConfig) => {
        //   this.log('InstConfig var' , InstConfig);
        this.log('InstConfig', getProjects);
        //   resolve(this.state.instanceConfigProject);
        // });
        resolve(getProjects);
      } else {
        resolve(false);
      }
      // this.log('InstConfig', this.state.instanceConfigProject);
    });
    // const ConfigWorkPackages = await this.getConfigWorkPackageType();
  });

  log = (text, data) => new Promise(() => {
    // console.log('===========================================================================================================');
    // console.log(text, JSON.stringify(data));
  });
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

  checkLogedInstance = () => new Promise((resolve) => {
    let i = 0;
    // console.log('instLoopCountInitial:',i);
    Object.keys(INSTANCE).forEach(async (key) => {
      // console.log('instLoopCountStart:',i);
      this.getCookies(INSTANCE[key].api.baseURL, '_open_project_session', (cookies) => {
        chrome.cookies.set({ url: INSTANCE[key].api.baseURL, name: '_open_project_session', value: cookies });
      });
      fetch(`${INSTANCE[key].api.apiURL}/my_preferences/`, this.state.authdataGet)
        .then(response => (response.json())).then((responseJson) => {
          i += 1;
          // console.log('instanceurl', `${INSTANCE[key].api.apiURL}/my_preferences/`);
          // console.log('response',responseJson);
          if (typeof responseJson._links !== 'undefined') {
            this.setState({ configData: this.state.configData.push(INSTANCE[key]) });
          } else {
            this.setState({ needToLogin: this.state.needToLogin.push(INSTANCE[key]) });
          }
          // console.log('instLoopCountEnd:',i);
          // console.log('configData',this.state.configData);
          if (i === Object.keys(INSTANCE).length) {
            if (this.state.configData.length === 0) {
              resolve(false);
            } else {
              resolve(true);
            }
          }
        });
    });
  });
  needToLogin = () => new Promise((resolve) => {
    resolve(this.state.needToLogin);
  });
  getInstanceConfigData = () => new Promise((resolve) => {
    let configPackageId = 0;
    const instanceProjects = [];
    let processCount = 1;
    const instProj = this.state.instanceConfigProject;
    instProj.forEach(async (instance) => {
      await this.getAllWorkPackageType(instance.instanceKey.api.apiURL, instance.configProject.id).then(async (response) => {
        this.log('packages got res', response);
        configPackageId = await this.getConfigWorkPackageType(response._embedded.schema.type._embedded.allowedValues);
        this.log('configPackageId', configPackageId);
        instanceProjects.push({
          instanceUniqName: instance.instanceUniqName,
          instanceKey: instance.instanceKey,
          configProject: instance.configProject,
          OtherProjects: instance.OtherProjects,
          configPackageId
        });
      });
      // this.setState(instanceProjects => ({ instanceConfigProject: instanceProjects }));
      this.log('instanceProjects', instanceProjects);
      // this.setState({ newinstanceConfigProject: 'Static value' });

      if (processCount === this.state.instanceConfigProject.length) {
        this.log('instanceConfigProject DATA', this.state.instanceProjects);
        this.setState({instanceConfigProject: instanceProjects})
        resolve(instanceProjects);
      }
      processCount += 1;
    });
  });

  getInstances = () => new Promise((resolve) => {
    this.log('length', this.state.configData.length);
    this.log('contn', this.state.configData);
    let resp = [];
    const confDataTemp = [];
    let processCount = 1;
    this.state.configData.forEach( async (instanceKey) => {
      let configProject = [];
      const OtherProjects = [];
      await this.getAllprojects(instanceKey.api.apiURL).then(async (projectList) => {
        this.log('projectList', projectList);
        projectList._embedded.elements.forEach(async (project) => {
          if (project.name === APIDATA.InstanceConfigProject) {
            configProject = project;
          } else {
            OtherProjects.push(project);
          }
        });
      });
      resp.push({ instanceUniqName: instanceKey.instanceUniqName, instanceKey, configProject, OtherProjects });
      this.setState({ instanceConfigProject: this.state.instanceConfigProject.push({ instanceUniqName: instanceKey.instanceUniqName, instanceKey, configProject, OtherProjects }) });
      // this.log('tmpProj first', instanceKey);
      // this.log('configProject', configProject);
      // this.log('OtherProjects', OtherProjects);
      this.log('instanceConfigProject', this.state.instanceConfigProject);

      if (processCount === this.state.configData.length) {
        this.log('length final ', this.state.configData.length);
        resolve(resp);
      }
      processCount += 1;
    });
  });

  getAllprojects = baseURL => new Promise((resolve) => {
    fetch(`${baseURL}/projects/`, this.state.authdataGet)
      .then((response) => {
        resolve(response.json());
      }).catch(() => {
        this.setState({ isLogin: false });
        this.setState({ showEdit: false });
        this.setState({ authenticate: false });
        chrome.storage.local.clear();
      });
  });
  getProjectsWithConfig = instanceData => new Promise((resolve) => {
    
    const instanceProjects = [];
    let processCount = 0;
    instanceData.forEach(async (instance) => {
      let activeProjects = [];
      let configData = [];
      const project = await fetch(`${instance.instanceKey.api.apiURL}/queries/default?filters=${encodeURIComponent(`[{"type":{"operator":"=","values":["${instance.configPackageId.id}"]}}]`)}`, this.state.authdataGet)
        .then((response) => {
          return (response.json()); 
        })
        .then(async (response) => {
          this.log('response NEw', response._embedded.results._embedded.elements);
          instance.OtherProjects.forEach(async (project) => {
            response._embedded.results._embedded.elements.forEach(async (respPackage) => {
              if (respPackage._links.project.href === project._links.self.href) {
                const contentType = await this.getContentType(respPackage.description.raw);
                activeProjects.push({ respPackage, project, contentType });
              }

              if(respPackage._links.project.href == instance.configProject._links.self.href) {
                configData = await this.getContentType(respPackage.description.raw);
              }
            });
          });
          processCount += 1;
        });
      instanceProjects.push({
        instanceUniqName: instance.instanceUniqName,
        instanceKey: instance.instanceKey,
        configProject: { configProject: instance.configProject, configData },
        OtherProjects: instance.OtherProjects,
        configPackageId: instance.configPackageId,
        activeProjects
      });
      this.log('203 processCount', [processCount, instanceData.length ]);
      if (processCount >= instanceData.length) {
        resolve(instanceProjects);
      }
    });
  });
  getProjectsWithConfigOld = instanceData => new Promise((resolve) => {
    const instanceProjects = [];
    let processCount = 1;
    instanceData.forEach(async (instance) => {
     const activeProjects =  await this.getWorkPackages(instance.instanceKey.api.apiURL, instance.OtherProjects, instance.configPackageId.id);
      instanceProjects.push({
        instanceUniqName: instance.instanceUniqName,
        instanceKey: instance.instanceKey,
        configProject: instance.configProject,
        OtherProjects: instance.OtherProjects,
        configPackageId: instance.configPackageId,
        activeProjects
      });
      this.log('processCount',processCount);
      if (processCount === this.state.instanceConfigProject.length) {
        resolve(instanceProjects);
      }
      processCount += 1;
    });
  });

  getConfigInstanceConfig = instanceData => new Promise((resolve) => {
    const instanceProjects = [];
    let processCount = 1;
    instanceData.forEach(async (instance) => {
      this.log('234 processCount',[ processCount, instanceData.length ]);
      const configData = await this.getInstaceConfigData(instance.instanceKey.api.apiURL, instance.configProject, instance.configPackageId.id);
      this.log('236 processCount',[ processCount, instanceData.length ]);
      instanceProjects.push({
        instanceUniqName: instance.instanceUniqName,
        instanceKey: instance.instanceKey,
        configProject: { configProject: instance.configProject, configData },
        OtherProjects: instance.OtherProjects,
        configPackageId: instance.configPackageId,
        activeProjects: instance.activeProjects
      });
      this.log('243 processCount', [ processCount, instanceData.length ]);
      if (processCount >= this.state.instanceConfigProject.length) {
        this.log('instanceProjects instance',  instanceProjects);
        resolve(instanceProjects);
      }
      processCount += 1;
      this.log('251 processCount', [ processCount, instanceData.length ]);
    });
  });

  getInstaceConfigData = (baseURL, project, typeId) => new Promise(async (resolve) =>{
    const res = await fetch(`${baseURL}/projects/${project.id}/work_packages?filters=${encodeURIComponent(`[{"type":{"operator":"=","values":["${typeId}"]}}]`)}`, this.state.authdataGet)
      .then((response) => {
        return (response.json())})
      .then(async (response) => {
        if (response.total > 0) {
          const content = await this.getContentType(response._embedded.elements[0].description.raw);
          resolve(content);
        }
      });
  });

  getWorkPackages = (baseURL, projects, typeId) => new Promise((resolve) =>{
    let processCount = 1;
    let activeProject = [];
    projects.forEach(async (project) => {
      const res  = await fetch(`${baseURL}/projects/${project.id}/work_packages?filters=${encodeURIComponent(`[{"type":{"operator":"=","values":["${typeId}"]}}]`)}`, this.state.authdataGet)
      .then((response) => {
        return (response.json())})
        .then(async (response) => {
        // console.log('response',response);
        if (response.total > 0) {
          const contentType = await this.getContentType(response._embedded.elements[0].description.raw);
          activeProject.push({response, project, contentType});
        }
        this.log('proicessCount work packaes',[processCount ,projects.length]);
        if (processCount === projects.length) {
          resolve(activeProject);
        }
        processCount += 1;
      });
      await this.log('FerchUrl',`${res}${baseURL}/projects/${project.id}/work_packages?filters=${encodeURIComponent(`[{"type":{"operator":"=","values":["${typeId}"]}}]`)}`);
    });
  });

  getAllWorkPackageType = (apiUrl, InstanceConfigProjectId) => new Promise((resolve) => {
    fetch(`${apiUrl}/projects/${InstanceConfigProjectId}/work_packages/form`, this.state.authdataPost)
      .then((response) => {
        // this.setState({ packages: response.json()._embedded.schema.type._links.allowedValues });
        resolve(response.json());
      });
  });

  getConfigWorkPackageType = packages => new Promise((resolve) => {
    packages.forEach(async (packageType) => {
      if (packageType.name === APIDATA.CONFIGURATION_TYPE_NAME) {
        resolve(packageType);
      }
    });
  });

  asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index += 1) {
      await callback(array[index], index, array);
    }
  }

  // returnConfigData = () => new Promise((resolve) => {
  //   let inst = [];
  //   this.state.configData.forEach(async (instanceKey) => {
  //     const ar = { [instanceKey.instanceUniqName]: {
  //       BaseUrl: instanceKey.api.baseURL,
  //       ApiUrl: instanceKey.api.apiURL,
  //     } };
  //     console.log('arrr', instanceKey.instanceUniqName);
  //     inst = await merge(inst, ar);
  //     inst.length += 1;
  //     await console.log(JSON.stringify(inst));
  //   });
  //   resolve(inst);
  // });

  getContentType = rawData => new Promise((resolve) => {
    this.log('raqData',rawData);
    this.log(rawData.substr(11,rawData.length - 14));
    yaml.safeLoadAll(decodeURIComponent(rawData.substr(11,rawData.length - 14)), (doc) => {
      resolve(doc);
    });
  });
}
