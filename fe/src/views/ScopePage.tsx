import { useState, useEffect, useMemo } from 'react';
import { Table, Layout } from '@arco-design/web-react';
import { loadOptions, publish } from '../api';

const Content = Layout.Content;
const Header = Layout.Header;

export default function ScopePage() {
  const [data, setData] = useState<{prefixList: any[]}>({
    prefixList: []
  });

  useEffect(() => {
    loadOptions().catch(() => ({ prefixList: [] })).then((resp) => {
      console.log(resp)
      setData(resp);
    });
  }, [setData]);

  const handlePublish = (item: any) => {
    console.log(item);
    publish(item.value, '');
  };

  return (
    <Content style={{ padding: '0 24px 24px', justifyContent: 'start' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between' }}>
      </Header>
      <Table
        columns={[{
          title: 'prefix',
          dataIndex: 'value',
        }, {
          title: 'options',
          render(col: any, item: any) {
            return (<button onClick={() => handlePublish(item)}>publish</button>);
          }
        }]}
        data={data.prefixList}
        rowKey="id"
      />
    </Content>
  );
}
