/**
 * Product Listing Client Component
 *
 * 使用 React Query 和新的 API 客户端的客户端组件示例
 */

'use client';

import { useProducts } from '../api/products';
import { ProductTable } from './product-tables';
import { columns } from './product-tables/columns';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';

export default function ProductListingClient() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('name', parseAsString);
  const [category] = useQueryState('category', parseAsString);

  const { data, isLoading, error, isSuccess } = useProducts({
    page,
    limit: perPage,
    search: search || undefined,
    categories: category || undefined
  });

  if (isLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />;
  }

  if (error) {
    return (
      <div className='text-destructive p-4'>
        Error loading products: {error.message}
      </div>
    );
  }

  if (!isSuccess || !data?.success || !data.data) {
    return <div className='p-4'>No products found</div>;
  }

  return (
    <ProductTable
      data={data.data}
      totalItems={data.total || data.data.length}
      columns={columns}
    />
  );
}
