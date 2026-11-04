export const monitorFixture = {
  summary: [
    {
      label: 'page.onlineNodes',
      value: '24 / 25',
    },
    {
      label: 'page.dbQps',
      value: '3,482',
    },
    {
      label: 'page.avgCpu',
      value: '49%',
    },
    {
      label: 'page.avgMem',
      value: '67%',
    },
  ],
  times: [
    '10:00',
    '10:05',
    '10:10',
    '10:15',
    '10:20',
    '10:25',
    '10:30',
    '10:35',
    '10:40',
  ],
  cpu: [42, 48, 55, 51, 63, 58, 47, 66, 59],
  network: {
    inbound: [120, 132, 101, 134, 90, 230, 210, 182, 191],
    outbound: [80, 92, 121, 94, 150, 110, 130, 122, 101],
  },
  health: 72,
  nodes: [
    {
      name: 'api-node-01',
      region: '华东 1',
      cpu: 34,
      mem: 58,
      alerting: false,
    },
    {
      name: 'api-node-02',
      region: '华东 2',
      cpu: 61,
      mem: 72,
      alerting: false,
    },
    {
      name: 'db-primary',
      region: '华北 1',
      cpu: 47,
      mem: 81,
      alerting: false,
    },
    {
      name: 'cache-01',
      region: '华南 1',
      cpu: 12,
      mem: 39,
      alerting: false,
    },
    {
      name: 'worker-04',
      region: '华东 1',
      cpu: 93,
      mem: 88,
      alerting: true,
    },
  ],
}
