import { Select, SelectProps } from '@arco-design/web-react';

const Option = Select.Option;

interface ISelectorProps extends SelectProps {
  list: string[];
}

export default function Selector(props: ISelectorProps) {
  const { list, ...selectorProps } = props;

  return (
    <Select
      // style={{ width: 345, marginRight: 20 }}
      {...selectorProps}
    >
      {list.map((option, index) => (
        <Option wrapperClassName='select-demo-hide-option-checkbox' key={index} value={option}>
          {option}
        </Option>
      ))}
    </Select>
  );
}
