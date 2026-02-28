import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { NumberCell } from '../src/cells/number-cell';
import { TextCell } from '../src/cells/text-cell';

describe('<NumberCell />', () => {
  it('calls onCommit with clamped & rounded value on Enter', () => {
    const handleCommit = vi.fn();
    const handleCancel = vi.fn();

    // 直接使用已更新的 draftValue 进行测试
    const { getByDisplayValue } = render(
      <table>
        <tbody>
          <tr>
            <NumberCell
              value={0}
              draftValue='12' // 模拟用户输入后的草稿值
              isEditing
              meta={{ min: 0, max: 10, decimals: 1, type: 'number' } as any}
              error={undefined}
              onStartEdit={vi.fn()}
              onChangeDraft={vi.fn()}
              onCommit={handleCommit}
              onCancel={handleCancel}
            />
          </tr>
        </tbody>
      </table>
    );

    const input = getByDisplayValue('12') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // 应该被裁剪到 max: 10，并保留 1 位小数
    expect(handleCommit).toHaveBeenCalledWith(10);
  });

  it('moves focus to next/prev on Tab and Shift+Tab', () => {
    const handleMoveFocus = vi.fn();

    const { getByDisplayValue } = render(
      <table>
        <tbody>
          <tr>
            <NumberCell
              value={1}
              draftValue={1}
              isEditing
              meta={{ editorType: 'number', type: 'number' } as any}
              error={undefined}
              onStartEdit={vi.fn()}
              onChangeDraft={vi.fn()}
              onCommit={vi.fn()}
              onCancel={vi.fn()}
              onMoveFocus={handleMoveFocus}
            />
          </tr>
        </tbody>
      </table>
    );

    const input = getByDisplayValue('1') as HTMLInputElement;

    fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' });
    expect(handleMoveFocus).toHaveBeenCalledWith('next');

    fireEvent.keyDown(input, { key: 'Tab', code: 'Tab', shiftKey: true });
    expect(handleMoveFocus).toHaveBeenCalledWith('prev');
  });
});

describe('<TextCell />', () => {
  it('calls onCommit with string value on Enter', () => {
    const handleCommit = vi.fn();

    const { getByDisplayValue } = render(
      <table>
        <tbody>
          <tr>
            <TextCell
              value='Alice'
              draftValue='Alice'
              isEditing
              meta={{ type: 'string' } as any}
              error={undefined}
              onStartEdit={vi.fn()}
              onChangeDraft={vi.fn()}
              onCommit={handleCommit}
              onCancel={vi.fn()}
            />
          </tr>
        </tbody>
      </table>
    );

    const input = getByDisplayValue('Alice') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleCommit).toHaveBeenCalledWith('Alice');
  });

  it('moves focus using onMoveFocus when Tab pressed', () => {
    const handleMoveFocus = vi.fn();

    const { getByDisplayValue } = render(
      <table>
        <tbody>
          <tr>
            <TextCell
              value='A'
              draftValue='A'
              isEditing
              meta={{ type: 'string' } as any}
              error={undefined}
              onStartEdit={vi.fn()}
              onChangeDraft={vi.fn()}
              onCommit={vi.fn()}
              onCancel={vi.fn()}
              onMoveFocus={handleMoveFocus}
            />
          </tr>
        </tbody>
      </table>
    );

    const input = getByDisplayValue('A') as HTMLInputElement;

    fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' });
    expect(handleMoveFocus).toHaveBeenCalledWith('next');
  });
});
