'use client';
import { useKBar } from 'kbar';
import { IconSearch } from '@tabler/icons-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip';

export default function SearchInput() {
  const { query } = useKBar();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-9 w-9'
            onClick={query.toggle}
          >
            <IconSearch className='h-4 w-4' />
            <span className='sr-only'>Search</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Search{' '}
            <kbd className='bg-muted pointer-events-none ml-1 inline-flex h-4 items-center gap-1 rounded border px-1 font-mono text-[10px] font-medium opacity-100 select-none'>
              <span className='text-xs'>⌘</span>K
            </kbd>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
