import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, InputNumber, Select, Button, Form } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { TableProps } from 'antd/lib/table';

const { Option } = Select;

export interface EditableTableColumn {
  title: string;
  dataIndex: string;
  key: string;
  width?: number | string;
  editable?: boolean;
  required?: boolean;
  inputType?: 'text' | 'number' | 'select' | 'custom';
  options?: { value: any; label: string }[];
  precision?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  formatter?: (value: any) => string;
  parser?: (value: string | undefined) => any;
  onChange?: (value: any, record: any, index: number) => void;
  customRender?: (props: {
    value: any;
    onChange: (value: any) => void;
    record: any;
    index: number;
    isEditing: boolean;
    style: React.CSSProperties;
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
    onFocus: () => void;
  }) => React.ReactNode;
}

export interface EditableTableProps<T extends Record<string, any>> extends Omit<TableProps<T>, 'columns'> {
  columns: EditableTableColumn[];
  dataSource: T[];
  onDataChange: (data: T[]) => void;
  rowKey: string;
  addButtonText?: string;
  onAddRow?: () => T;
  onDeleteRow?: (record: T, index: number) => boolean | Promise<boolean>;
  onSave?: (record: T) => void | Promise<void>;
  onCancel?: () => void;
  disableEnterSubmit?: boolean;
}

export function EditableTable<T extends Record<string, any>>({
  columns,
  dataSource,
  onDataChange,
  rowKey,
  addButtonText = 'Satır Ekle',
  onAddRow,
  onDeleteRow,
  onSave,
  onCancel,
  disableEnterSubmit = true,
  ...restProps
}: EditableTableProps<T>) {
  // Düzenlenen satır için state
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);

  // Klavye navigasyonu için fonksiyon
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>, index: number, column: string) => {
    // Enter tuşuna basıldığında form gönderimini engelle
    if (e.key === 'Enter' && disableEnterSubmit) {
      e.preventDefault();
      
      // Bir sonraki sütuna geç
      const editableColumns = columns
        .filter(col => col.editable !== false)
        .map(col => col.dataIndex);
      
      const currentIndex = editableColumns.indexOf(column);
      
      if (currentIndex < editableColumns.length - 1) {
        // Aynı satırda bir sonraki sütuna geç
        setEditingColumn(editableColumns[currentIndex + 1]);
      } else if (index < dataSource.length - 1) {
        // Bir sonraki satırın ilk sütununa geç
        setEditingRowIndex(index + 1);
        setEditingColumn(editableColumns[0]);
      }
    }
    // Sağ ok tuşu
    else if (e.key === 'ArrowRight') {
      const editableColumns = columns
        .filter(col => col.editable !== false)
        .map(col => col.dataIndex);
      
      const currentIndex = editableColumns.indexOf(column);
      
      if (currentIndex < editableColumns.length - 1) {
        setEditingColumn(editableColumns[currentIndex + 1]);
      }
    }
    // Sol ok tuşu
    else if (e.key === 'ArrowLeft') {
      const editableColumns = columns
        .filter(col => col.editable !== false)
        .map(col => col.dataIndex);
      
      const currentIndex = editableColumns.indexOf(column);
      
      if (currentIndex > 0) {
        setEditingColumn(editableColumns[currentIndex - 1]);
      }
    }
    // Yukarı ok tuşu
    else if (e.key === 'ArrowUp' && index > 0) {
      setEditingRowIndex(index - 1);
    }
    // Aşağı ok tuşu
    else if (e.key === 'ArrowDown' && index < dataSource.length - 1) {
      setEditingRowIndex(index + 1);
    }
  }, [columns, dataSource.length, disableEnterSubmit]);

  // Veri değişikliği işleyicisi
  const handleValueChange = useCallback((index: number, dataIndex: string, value: any) => {
    const newData = [...dataSource];
    // TypeScript hatasını çözmek için as any kullanıyoruz
    (newData[index] as any)[dataIndex] = value;
    
    // Özel onChange işleyicisi varsa çağır
    const column = columns.find(col => col.dataIndex === dataIndex);
    if (column?.onChange) {
      column.onChange(value, newData[index], index);
    }
    
    onDataChange(newData);
  }, [dataSource, columns, onDataChange]);

  // Satır ekleme işleyicisi
  const handleAddRow = useCallback(() => {
    let newRow: T;
    
    if (onAddRow) {
      newRow = onAddRow();
    } else {
      // Varsayılan boş satır oluştur
      newRow = {} as T;
      columns.forEach(column => {
        // TypeScript hatasını çözmek için as any kullanıyoruz
        (newRow as any)[column.dataIndex] = undefined;
      });
      // TypeScript hatasını çözmek için as any kullanıyoruz
      (newRow as any)[rowKey] = `new-${Date.now()}`;
    }
    
    const newData = [...dataSource, newRow];
    onDataChange(newData);
    
    // Yeni eklenen satırın ilk düzenlenebilir sütununa odaklan
    const firstEditableColumn = columns.find(col => col.editable !== false)?.dataIndex;
    if (firstEditableColumn) {
      setEditingRowIndex(newData.length - 1);
      setEditingColumn(firstEditableColumn);
    }
  }, [dataSource, columns, onAddRow, onDataChange, rowKey]);

  // Satır silme işleyicisi
  const handleDeleteRow = useCallback(async (record: T, index: number) => {
    if (onDeleteRow) {
      const canDelete = await onDeleteRow(record, index);
      if (!canDelete) return;
    }
    
    const newData = [...dataSource];
    newData.splice(index, 1);
    onDataChange(newData);
  }, [dataSource, onDataChange, onDeleteRow]);

  // Sütunları düzenlenebilir yap
  const renderColumns = columns.map(column => {
    const { dataIndex, title, inputType, editable, ...restColumnProps } = column;
    
    return {
      ...column,
      render: (value: any, record: any, index: number) => {
        // Özel render fonksiyonu varsa kullan
        if (column.render && (editable === false || column.customRender === undefined)) {
          return column.render(value, record, index);
        }
        
        const isEditing = editingRowIndex === index && editingColumn === dataIndex;
        
        // Düzenleme stili
        const editStyle: React.CSSProperties = {
          width: '100%',
          backgroundColor: isEditing ? '#fffbe6' : undefined,
        };
        
        // Minimum genişlik ekle
        if (typeof column.width === 'number') {
          editStyle.minWidth = `${column.width * 0.8}px`;
        }
        
        // Özel render fonksiyonu
        if (column.customRender) {
          return column.customRender({
            value,
            onChange: (newValue) => handleValueChange(index, dataIndex, newValue),
            record,
            index,
            isEditing,
            style: editStyle,
            onKeyDown: (e) => handleKeyDown(e, index, dataIndex),
            onFocus: () => {
              setEditingRowIndex(index);
              setEditingColumn(dataIndex);
            },
          });
        }
        
        // Input türüne göre bileşen oluştur
        switch (inputType) {
          case 'number':
            return (
              <InputNumber
                value={value}
                min={column.min}
                max={column.max}
                step={column.step}
                precision={column.precision}
                controls={false}
                style={editStyle}
                formatter={column.formatter}
                parser={column.parser as ((displayValue: string | undefined) => any) | undefined}
                disabled={column.disabled}
                onChange={(newValue) => handleValueChange(index, dataIndex, newValue)}
                onFocus={() => {
                  setEditingRowIndex(index);
                  setEditingColumn(dataIndex);
                }}
                onKeyDown={(e) => handleKeyDown(e, index, dataIndex)}
              />
            );
          case 'select':
            return (
              <Select
                value={value}
                style={editStyle}
                dropdownMatchSelectWidth={false}
                disabled={column.disabled}
                onChange={(newValue) => handleValueChange(index, dataIndex, newValue)}
                onFocus={() => {
                  setEditingRowIndex(index);
                  setEditingColumn(dataIndex);
                }}
                onKeyDown={(e) => handleKeyDown(e, index, dataIndex)}
              >
                {column.options?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            );
          default:
            return (
              <Input
                value={value}
                style={editStyle}
                disabled={column.disabled}
                onChange={(e) => handleValueChange(index, dataIndex, e.target.value)}
                onFocus={() => {
                  setEditingRowIndex(index);
                  setEditingColumn(dataIndex);
                }}
                onKeyDown={(e) => handleKeyDown(e, index, dataIndex)}
              />
            );
        }
      },
    };
  });

  // Silme sütunu ekle
  const deleteColumn = {
    title: 'İşlem',
    key: 'operation',
    width: 60,
    render: (_: any, record: T, index: number) => (
      <Button
        type="text"
        danger
        icon={<DeleteOutlined />}
        onClick={() => handleDeleteRow(record, index)}
      />
    ),
  };

  return (
    <div>
      <Table
        {...restProps}
        columns={[...renderColumns, deleteColumn]}
        dataSource={dataSource}
        rowKey={rowKey}
        rowClassName={(record, index) => 
          editingRowIndex === index ? 'editing-row' : ''
        }
        pagination={false}
        size="small"
        style={{ fontSize: '0.8em' }}
        onRow={(record, index) => ({
          onClick: () => {
            if (index !== undefined) {
              setEditingRowIndex(index);
            }
          },
        })}
      />
      <Button
        type="dashed"
        onClick={handleAddRow}
        style={{ width: '100%', marginTop: 16 }}
        icon={<PlusOutlined />}
      >
        {addButtonText}
      </Button>
    </div>
  );
}

export default EditableTable;
