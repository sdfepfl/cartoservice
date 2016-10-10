/* eslint react/prop-types: 0 */

import React from 'react';
import { Col } from 'react-bootstrap';
import * as _ from 'lodash';

import Carto from './Carto';

class RightPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: null };
  }
  componentDidMount() {
    this.fetchServices(this.props.process);
  }
  componentWillReceiveProps(nextProps) {
    this.fetchServices(nextProps.process);
  }
  fetchServices(process) {
    if (!_.isEmpty(process)) {
      const data = {};

      const result = fetch(`http://128.178.116.122:31304/api/get/${process.type}/${process.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      });

      result
        .then(res => res.json())
        .then((json) => {
          switch (process.type) {
            case 'process':
              data.process = {
                id: process.id,
                label: process.label,
                systemId: json.processInfo.SystemId,
              };
              data.services = _.map(
                json.services,
                k => ({
                  id: k.ServiceId,
                  label: k.Label,
                  systemId: k.SystemId,
                  systemLabel: k.SystemLabel,
                })
              );
              break;
            case 'custom':
              data.dataset = JSON.parse(json[0].Dataset);
              break;
            default:
              break;
          }

          this.setState({
            data,
          });
        })
        .catch((ex) => {
          console.log('failed', ex);
        });
    }
  }
  render() {
    return (<Col md={9}>
      {!_.isEmpty(this.props.process)
        ? <Carto data={this.state.data} addCustom={this.props.addCustom} />
        : <h5>Please select a process or custom map</h5>
      }
    </Col>);
  }
}

export default RightPanel;
