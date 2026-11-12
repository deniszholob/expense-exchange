export enum DataSource {
  LocalFile = 'LocalFile',
  WebStorage = 'WebStorage',
  RemoteApi = 'RemoteApi',
}

export const DATA_SOURCE_OPTIONS: DataSource[] = Object.values(DataSource);

export function isDataSource(value: string): value is DataSource {
  return DATA_SOURCE_OPTIONS.includes(value as DataSource);
}

// ====== Simple Enum Association: enum => string ===== //
// export const DATA_SOURCE_DISPLAY: Record<DataSource, string> = {
//   [DataSource.option1]: 'Option 1',
// };

// ====== Advanced Enum Association: enum => object ===== //
export interface DataSourceInfo {
  id: DataSource;
  display: string;
  path: string;
}

export const DATA_SOURCE_INFO: Record<DataSource, DataSourceInfo> = {
  [DataSource.LocalFile]: {
    id: DataSource.LocalFile,
    display: 'Local File',
    path: '',
  },
  [DataSource.WebStorage]: {
    id: DataSource.WebStorage,
    display: 'Web Storage',
    path: 'data',
  },
  [DataSource.RemoteApi]: {
    id: DataSource.RemoteApi,
    display: 'Remote API',
    path: '//localhost:3000/',
  },
} as const;

export const DATA_SOURCE_INFO_OPTIONS: DataSourceInfo[] =
  DATA_SOURCE_OPTIONS.map(
    (o: DataSource): DataSourceInfo => DATA_SOURCE_INFO[o],
  );

// ====== Visualize Data ===== //
// console.log({ DATA_SOURCE_OPTIONS, DATA_SOURCE_DISPLAY, DATA_SOURCE_INFO, DATA_SOURCE_INFO_OPTIONS });
