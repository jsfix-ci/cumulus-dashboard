'use strict';
import url from 'url';
import path from 'path';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  interval,
  getReconciliationReport
} from '../../actions';
import { nullValue } from '../../utils/format';
import SortableTable from '../table/sortable';
import Metadata from '../table/metadata';
import Loading from '../app/loading-indicator';
import ErrorReport from '../errors/report';
import { updateInterval } from '../../config';

const metaAccessors = [
  ['Created', 'reportStartTime'],
  ['Status', 'status']
];

const tableHeaderS3 = [
  'Filename',
  'Bucket',
  'S3 Link'
];

const tableRowS3 = [
  (d) => d.filename,
  (d) => d.bucket,
  (d) => d ? <a href={d.path} target='_blank'>Link</a> : nullValue
];

const tableHeaderDynamoDb = [
  'GranuleId',
  'Filename',
  'Bucket',
  'S3 Link'
];

const tableRowDyanmoDb = [
  (d) => d.granuleId,
  (d) => d.filename,
  (d) => d.bucket,
  (d) => d ? <a href={d.path} target='_blank'>Link</a> : nullValue
];

class ReconciliationReport extends React.Component {
  constructor () {
    super();
    this.reload = this.reload.bind(this);
    this.navigateBack = this.navigateBack.bind(this);
  }

  componentDidMount () {
    const { reconciliationReportName } = this.props.params;
    const immediate = !this.props.reconciliationReports.map[reconciliationReportName];
    this.reload(immediate);
  }

  componentWillUnmount () {
    if (this.cancelInterval) { this.cancelInterval(); }
  }

  reload (immediate) {
    const { reconciliationReportName } = this.props.params;
    const { dispatch } = this.props;
    if (this.cancelInterval) { this.cancelInterval(); }
    this.cancelInterval = interval(() => dispatch(getReconciliationReport(reconciliationReportName)), updateInterval, immediate);
  }

  navigateBack () {
    this.props.router.push('/reconciliations');
  }

  render () {
    const { reconciliationReports } = this.props;
    const { reconciliationReportName } = this.props.params;

    const record = reconciliationReports.map[reconciliationReportName];

    if (!record || (record.inflight && !record.data)) {
      return <Loading />;
    }

    let filesInS3 = [];
    let filesInDynamoDb = [];

    let filesOnlyInCumulus = [];
    let filesOnlyInCmr = [];

    if (record && record.data) {
      const report = record.data;
      const { filesInCumulus, filesInCumulusCmr } = report;

      if (filesInCumulus.onlyInDynamoDb && filesInCumulus.onlyInS3) {
        filesInS3 = filesInCumulus.onlyInS3.map(d => {
          const parsed = url.parse(d);
          return {
            filename: path.basename(parsed.pathname),
            bucket: parsed.hostname,
            path: parsed.href
          };
        });

        filesInDynamoDb = filesInCumulus.onlyInDynamoDb.map(d => {
          const parsed = url.parse(d.uri);
          return {
            granuleId: d.granuleId,
            filename: path.basename(parsed.pathname),
            bucket: parsed.hostname,
            path: parsed.href
          };
        });
      }

      if (filesInCumulusCmr.onlyInCumulus && filesInCumulusCmr.onlyInCmr) {
        filesOnlyInCumulus = filesInCumulusCmr.onlyInCumulus.map(d => {
          const parsed = url.parse(d.uri);
          return {
            granuleId: d.granuleId,
            filename: path.basename(parsed.pathname),
            bucket: parsed.hostname,
            path: parsed.href
          };
        });

        filesOnlyInCmr = filesInCumulusCmr.onlyInCmr.map(d => {
          const parsed = url.parse(d.URL);
          return {
            filename: path.basename(parsed.pathname),
            bucket: parsed.hostname.split('.')[0],
            path: parsed.href
          };
        });
      }
    }

    let error;
    if (record && record.data) {
      error = record.data.error;
    }

    const dynamoS3MetaAccessors = [
      ['OK file count', 'filesInCumulus.okCount']
    ];

    const cumulusCmrMetaAccessors = [
      ['OK file count', 'filesInCumulusCmr.okCount']
    ];

    return (
      <div className='page__component'>
        <section className='page__section page__section__header-wrapper'>
          <div className='page__section__header'>
            <h1 className='heading--large heading--shared-content with-description '>{reconciliationReportName}</h1>
            {error ? <ErrorReport report={error} /> : null}
          </div>
        </section>

        <section className='page__section'>
          <div className='heading__wrapper--border'>
            <h2 className='heading--medium with-description'>Reconciliation report</h2>
          </div>
          <Metadata data={record.data} accessors={metaAccessors} />
        </section>

        <section className='page__section'>
          <div className='heading__wrapper--border'>
            <h2 className='heading--medium heading--shared-content with-description'>
              DynamoDB vs S3
            </h2>
          </div>

          <div className='page__section--small'>
            <Metadata data={record.data} accessors={dynamoS3MetaAccessors} />
          </div>

          <div className='page__section--small'>
            <h3 className='heading--small heading--shared-content with-description'>
              Files only in DynamoDB ({filesInDynamoDb.length})
            </h3>
            <SortableTable
              data={filesInDynamoDb}
              header={tableHeaderDynamoDb}
              row={tableRowDyanmoDb}
              props={['granuleId', 'filename', 'bucket', 'link']}
            />
          </div>

          <div className='page__section--small'>
            <h3 className='heading--small heading--shared-content with-description'>
              Files only in S3 ({filesInS3.length})
            </h3>
            <SortableTable
              data={filesInS3}
              header={tableHeaderS3}
              row={tableRowS3}
              props={['filename', 'bucket', 'link']}
            />
          </div>
        </section>

        <section className='page__section'>
          <div className='heading__wrapper--border'>
            <h2 className='heading--medium heading--shared-content with-description'>
              Cumulus vs CMR
            </h2>
          </div>

          <div className='page__section--small'>
            <Metadata data={record.data} accessors={cumulusCmrMetaAccessors} />
          </div>

          <div className='page__section--small'>
            <h3 className='heading--small heading--shared-content with-description'>
              Files only in Cumulus ({filesOnlyInCumulus.length})
            </h3>
            <SortableTable
              data={filesOnlyInCumulus}
              header={tableHeaderDynamoDb}
              row={tableRowDyanmoDb}
              props={['granuleId', 'filename', 'bucket', 'link']}
            />
          </div>

          <div className='page__section--small'>
            <h3 className='heading--small heading--shared-content with-description'>
              Files only in CMR ({filesOnlyInCmr.length})
            </h3>
            <SortableTable
              data={filesOnlyInCmr}
              header={tableHeaderS3}
              row={tableRowS3}
              props={['filename', 'bucket', 'link']}
            />
          </div>
        </section>
      </div>
    );
  }
}

ReconciliationReport.propTypes = {
  reconciliationReports: PropTypes.object,
  dispatch: PropTypes.func,
  params: PropTypes.object,
  router: PropTypes.object
};

ReconciliationReport.defaultProps = {
  reconciliationReports: []
};

export { ReconciliationReport };
export default connect(state => state)(ReconciliationReport);
