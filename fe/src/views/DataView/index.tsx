import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Table, Input, Button } from '@arco-design/web-react';
import { IconSearch, IconEdit } from '@arco-design/web-react/icon';
import { EditableCell } from './EditableCell';
import { IList, ITableReq } from '../../api/types';
import { loadOptions } from '../../api';
import './index.css';

export interface ITableMod {
  list: IList[];
  pageNo: number;
  total: number;
  pageSize: number;
}

interface ITableDataProps {
  selected: any[];
  data: ITableMod;
  onSelect?(s: any[]): void;
  onLoad(p: ITableReq): Promise<void>;
  onEditKey?(p: string, k: string): void;
  onSaveTxt?(r: IList, v?: string): void;
}

function useColumns(
  prefixes: string[],
  langs: string[],
  onEditKey?: (p: string, k: string) => void,
  onSave?: (r: IList, v: string) => void
) {
  const inputRef = useRef<any>(null);

  return useMemo(() => {
    const search = {
      filterIcon: <IconSearch />,
      filterDropdown: ({ filterKeys, setFilterKeys, confirm }: any) => {
        return (
          <div className='arco-table-custom-filter'>
            <Input.Search
              ref={inputRef}
              searchButton
              placeholder='Please enter name'
              value={filterKeys[0] || ''}
              onChange={(value) => setFilterKeys(value ? [value] : [])}
              onSearch={() => confirm()}
            />
          </div>
        );
      },
      onFilterDropdownVisibleChange: (visible: boolean) => {
        if (!visible || !inputRef.current!.focus) return;
        setTimeout(() => inputRef.current!.focus(), 150);
      }
    };

    return [
      {
        title: 'scope',
        dataIndex: 'scope',
        filters: prefixes.map(p => ({ text: p, value: p }))
      },
      {
        title: 'key',
        dataIndex: 'key',
        ...search,
        ...(
          onEditKey
          ? {
            render(col: string, record: IList) {
              return (
                <div className="event-cell">
                  {col}
                  <Button type="primary" icon={<IconEdit />} onClick={() => onEditKey(record.scope, col)} />
                </div>
              );
            }
          } : {}
        )
      },
      {
        title: 'language',
        dataIndex: 'language',
        filters: langs.map(l => ({ text: l, value: l })),
        defaultFilters: []
      },
      {
        title: 'value',
        dataIndex: 'value',
        editable: true,
        ...search,
        ...(onSave ? {
          render(col: string, record: IList) {
            return <EditableCell value={col} onSave={v => onSave(record, v)} />
          }
        }: {})
      },
    ];
  }, [prefixes, langs, onEditKey, onSave]);
}

export default function DataView(props: ITableDataProps) {
  const {
    selected,
    data,
    onSelect,
    onEditKey,
    onSaveTxt,
    onLoad
  } = props;
  const setPaginationRef = useRef<(args: any) => void>();
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const columns = useColumns(prefixes, langs, onEditKey, onSaveTxt);
  const [pagination, _setPagination] = useState({
    sizeCanChange: true,
    showTotal: true,
    total: data.total,
    pageSize: data.pageSize,
    current: data.pageNo,
    pageSizeChangeResetCurrent: true,
  });
  setPaginationRef.current = (args: any) => _setPagination({ ...pagination, ...args });

  useEffect(() => {
    loadOptions()
    .then(({ prefixList, languages }) => {
      setPrefixes(prefixList.map(item => item.value));
      setLangs(languages);
    });
  }, [setPrefixes, setLangs]);

  const onChangeTable = useCallback(async (_pagination: any, sorter?: any, filter: any = {}) => {
    const { current, pageSize } = _pagination;
    setLoading(true);
    const { key = [], value = [], ..._filter } = filter;
    onLoad({
      ..._filter,
      key: key[0] || '',
      value: value[0] || '',
      pageNo: current,
      pageSize
    });
  }, [setLoading, onLoad]);

  const batch = useMemo(() => (!onSelect ? undefined : {
    selectedRowKeys: selected,
    onChange: onSelect,
  }), [selected, onSelect]);


  useEffect(() => {
    setPaginationRef.current!({
      current: data.pageNo,
      pageSize: data.pageSize,
      total: data.total
    });
    setLoading(false);
  }, [data, setLoading]);

  return useMemo(() => (
    <Table
      loading={loading}
      columns={columns}
      data={data.list}
      rowKey="id"
      pagination={pagination}
      onChange={onChangeTable}
      rowSelection={batch}
    />
  ), [loading, columns, data.list, pagination, batch, onChangeTable]);
}
