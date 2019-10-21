/* eslint-disable react/jsx-indent */
import React from 'react';

export default class ShareContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAutoClassificationTab: false,
      autoClassificationData: [],
      meshData: [],
      domContents: this.props.domContents,
      metaData: this.props.metaData,
      extractedContent: [],
      configData: this.props.configdata,
    };
  }
  componentDidMount() {
    this.getExtractedContent();
    this.getMeshData();
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
            if (JSON.parse(doc.body)) {
              this.setState({ autoClassificationData: { meshData: JSON.parse(doc.body) } });
              this.setState({ meshData: JSON.parse(doc.body) });
              const tempObject = {
                key: 'mesh',
                data: JSON.parse(doc.body)
              };
              this.props.onContentChange(tempObject);
              this.setState({ showAutoClassificationTab: true });
            } else {
              this.setState({ showAutoClassificationTab: true });
            }
          } catch (error) {
            this.setState({ showAutoClassificationTab: true });
          }
        } else {
          this.setState({ showAutoClassificationTab: true });
        }
      };
      x.onerror = (e) => {
        throw e;
      };
      const text = striptags(this.state.domContents, [], '\n');
      x.send(JSON.stringify({ input: text }));
    }
    getExtractedContent() {
      let extractedData = [];
      this.state.metaData.map((meta, i) => {
        const fetcKeyWords = this.state.configData.metaTags.extractKeyWords;
        const key = meta.name;
        if (fetcKeyWords.includes(key)) {
          const metaContent = meta.content;
          const metaArray = metaContent.split(',');
          for (let i = 0; i < metaArray.length; i++) {
            const tempObj = {
              name: key,
              content: metaArray[i]
            };
            extractedData.push(tempObj);
          }
        }
      });
      extractedData = extractedData.sort((a,b) => (a.content > b.content) ? 1 : ((b.content > a.content) ? -1 : 0));
      const tempObject = {
        key: 'keyWords',
        data: extractedData
      };
      this.props.onContentChange(tempObject);
      this.setState({ extractedContent: extractedData });
    }
    render() {
      return (
        <div className="usa-accordion site-accordion-code">
          <h4 className="usa-accordion__heading site-accordion-code">
            <button
              className="usa-accordion__button"
              aria-expanded="true"
              aria-controls="metaDataContent"
            >Auto Classification</button>
          </h4>
          <div id="metaDataContent" className="usa-accordion__content usa-prose ds-u-padding-left--1 ds-u-padding-top--0">
            <section className="ds-u-margin-left--1 preview__label ds-u-font-style--normal ds-l-container" style={{ height: '500px' }}>
              <div className="ds-l-row">
                <div className="ds-l-col--12"><h4>Extracted Keywords</h4></div>
                {this.state.extractedContent.map(meta => <div className="ds-l-col--12"><label><input type="checkbox" value={meta.name} /><span className="ds-u-padding-left--1" >{meta.content} ({meta.name})</span>
                </label></div>)
                }
              </div>
              <div className="ds-l-row">
                <div className="ds-l-col--12"><h4>NIH Medical Subjects Heading (MeSH)</h4></div>
                {this.state.showAutoClassificationTab ? <div className="ds-l-col--12">
                  {this.state.autoClassificationData.meshData ? this.state.autoClassificationData.meshData.MoD_Raw.Term_List.map(type => <div><label><input type="checkbox" value={type.term} /><span className="ds-u-padding-left--1" >{type.Term}</span>
                  </label></div>)
                    : null}
                </div> : <button className="ds-c-button ds-c-button--primary">
                  <span className="ds-c-spinner ds-c-spinner--small ds-c-spinner--inverse" aria-valuetext="Fetching classifications from NIH Medical Subject Headings (MeSH)" role="progressbar" /> Fetching classifications from NIH Medical Subject Headings (MeSH)
                </button>}
              </div>
            </section>
          </div>
        </div>
      );
    }
}
