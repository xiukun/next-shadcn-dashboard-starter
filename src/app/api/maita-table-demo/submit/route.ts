import { NextResponse } from 'next/server';

type DemoRow = {
  id: number;
  name: string;
  price: number;
  change: number;
  status: 'active' | 'archived';
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { edits } = body as {
      edits: Array<{ rowKey: string; row: DemoRow }>;
    };

    // 这里应该将编辑保存到数据库
    // 示例中只是返回成功响应
    console.log('收到批量提交:', edits.length, '条记录');

    // 模拟处理延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: `成功提交 ${edits.length} 条记录`,
      submitted: edits.length
    });
  } catch (error) {
    console.error('提交错误:', error);
    return NextResponse.json(
      { success: false, error: '提交失败' },
      { status: 500 }
    );
  }
}
