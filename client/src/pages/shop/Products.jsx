import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { productService } from '@/services/product.service';
import { queryKeys } from '@/lib/queryClient';
import { ProductCard } from '@/components/shop/ProductCard';
import { ProductCardSkeleton, EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/format';

const SORTS = [
  ['relevance', 'Recommended'], ['popular', 'Best selling'], ['newest', 'Newest first'],
  ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['rating', 'Highest rated'],
];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const { addItem } = useCart();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(params.get('search') || '');
  const searchParam = params.get('search') || '';

  const query = useMemo(() => ({
    search: params.get('search') || undefined,
    category: params.get('category') || undefined,
    minPrice: params.get('minPrice') || undefined,
    maxPrice: params.get('maxPrice') || undefined,
    rating: params.get('rating') || undefined,
    inStock: params.get('inStock') || undefined,
    sort: params.get('sort') || 'relevance',
    page: Number(params.get('page') || 1),
    limit: 12,
  }), [params]);

  const facets = useQuery({ queryKey: queryKeys.facets, queryFn: productService.facets, staleTime: 10 * 60_000 });
  const products = useQuery({
    queryKey: queryKeys.products(query),
    queryFn: () => productService.list(query),
    placeholderData: keepPreviousData,
  });

  // Update several URL params in one go. Calling setParam twice in a row
  // loses the first change because both calls start from the same old params.
  const setMany = (updates) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => {
      if (value == null || value === '') next.delete(key);
      else next.set(key, value);
    });
    next.delete('page');
    setParams(next, { replace: true });
  };

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value == null || value === '') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  // Debounced search keeps the URL shareable without a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchParam === searchDraft) return;
      setParam('search', searchDraft || null);
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  // If the URL changes from elsewhere (navbar search, clear filters, back button),
  // reflect it in the search box.
  useEffect(() => {
    setSearchDraft(searchParam);
  }, [searchParam]);

  const clearAll = () => {
    setParams({});
    setSearchDraft('');
  };

  const activeFilters = ['category', 'minPrice', 'maxPrice', 'rating', 'inStock'].filter((k) => params.get(k));
  const items = products.data?.data ?? [];
  const meta = products.data?.meta;

  const filterPanel = (
    <div className="space-y-7">
      <fieldset>
        <legend className="mb-3 text-[14px] font-semibold">Category</legend>
        <div className="space-y-1">
          <FilterRadio checked={!params.get('category')} onChange={() => setParam('category', null)} label="All categories" />
          {facets.data?.categories.map((c) => (
            <FilterRadio key={c.name} checked={params.get('category') === c.name}
              onChange={() => setParam('category', c.name)} label={c.name} count={c.count} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-[14px] font-semibold">Price</legend>
        <div className="space-y-1">
          {[[null, null, 'Any price'], [null, 3000, 'Under ₹3,000'], [3000, 8000, '₹3,000 – ₹8,000'],
            [8000, 15000, '₹8,000 – ₹15,000'], [15000, null, 'Above ₹15,000']].map(([min, max, label]) => (
            <FilterRadio key={label} label={label}
              checked={String(params.get('minPrice') || '') === String(min || '') && String(params.get('maxPrice') || '') === String(max || '')}
              onChange={() => setMany({ minPrice: min, maxPrice: max })} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-[14px] font-semibold">Rating</legend>
        <div className="space-y-1">
          {[4.5, 4, 3.5].map((r) => (
            <FilterRadio key={r} label={`${r} and above`} checked={params.get('rating') === String(r)}
              onChange={() => setParam('rating', params.get('rating') === String(r) ? null : r)} />
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink-soft">
        <input type="checkbox" checked={params.get('inStock') === 'true'}
          onChange={(e) => setParam('inStock', e.target.checked ? 'true' : null)}
          className="h-4 w-4 rounded border-line-strong text-brand-600 focus:ring-brand-600" />
        In stock only
      </label>

      {activeFilters.length > 0 && (
        <Button variant="link" size="sm" onClick={() => setParams(params.get('search') ? { search: params.get('search') } : {})}>
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="font-display text-display">
          {params.get('category') || (params.get('search') ? `Results for “${params.get('search')}”` : 'All products')}
        </h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          {meta ? `${meta.total} product${meta.total === 1 ? '' : 's'}` : 'Loading catalogue…'}
          {facets.data && ` · ${formatCurrency(facets.data.priceRange.min)} to ${formatCurrency(facets.data.priceRange.max)}`}
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search the catalogue" aria-label="Search the catalogue" className="field h-10 pl-9 text-[14px]" />
        </div>
        <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
        </Button>
        <Select value={query.sort} onChange={(e) => setParam('sort', e.target.value)}
          aria-label="Sort products" className="h-10 w-auto min-w-[170px] text-[14px]">
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-28">{filterPanel}</div></aside>

        <div>
          {products.isError ? (
            <ErrorState message={products.error?.message} onRetry={products.refetch} />
          ) : products.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="No products match these filters"
              description="Try widening the price range, or clear the filters to see the full catalogue."
              action={<Button variant="secondary" onClick={clearAll}>Clear filters</Button>} />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((p) => <ProductCard key={p._id} product={p} onAddToCart={addItem} />)}
              </div>
              <div className="mt-10">
                <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total}
                  onChange={(p) => { setParam('page', p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              </div>
            </>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[80] bg-ink/40 lg:hidden" onClick={() => setFiltersOpen(false)}>
          <div className="absolute inset-y-0 right-0 w-[86%] max-w-sm overflow-y-auto bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-[18px] font-semibold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X className="h-5 w-5" /></button>
            </div>
            {filterPanel}
            <Button className="mt-8 w-full" onClick={() => setFiltersOpen(false)}>Show {meta?.total ?? ''} results</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterRadio({ checked, onChange, label, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md py-1 text-[14px] text-ink-soft hover:text-ink">
      <input type="radio" checked={checked} onChange={onChange}
        className="h-4 w-4 border-line-strong text-brand-600 focus:ring-brand-600" />
      <span className="flex-1">{label}</span>
      {count != null && <span className="tnum text-[12.5px] text-ink-muted">{count}</span>}
    </label>
  );
}