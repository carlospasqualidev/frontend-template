import { Fragment } from 'react';
import { Link, useLocation, useMatches } from '@tanstack/react-router';

import {
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  Breadcrumb as BaseBreadCrumb,
} from '@/components/ui/breadcrumb';
import { useBreadcrumbExtraCrumbs } from '@/hooks/useBreadcrumbExtra';
import { getRememberedSearch } from '@/lib/navigation/searchMemory';

function normalizeRoutePath(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function Breadcrumb() {
  const matches = useMatches();
  const location = useLocation();
  const extraCrumbs = useBreadcrumbExtraCrumbs(location.pathname);

  const items = matches.reduce<
    Array<{ routeId: string; pathname: string; title: string }>
  >((acc, match) => {
    const routeId = String(match.routeId);
    const pathname = normalizeRoutePath(match.pathname);
    const title =
      typeof match.staticData?.breadcrumb === 'string'
        ? match.staticData.breadcrumb
        : undefined;

    if (routeId === '__root__' || routeId === 'protected-layout') {
      return acc;
    }

    if (!title) {
      return acc;
    }

    const lastItem = acc.at(-1);
    if (lastItem?.pathname === pathname) {
      acc[acc.length - 1] = { routeId, pathname, title };
      return acc;
    }

    acc.push({ routeId, pathname, title });
    return acc;
  }, []);

  const baseItems =
    items.length > 1 && items[0]?.pathname === '/' ? items.slice(1) : items;

  // O crumb que aponta para a própria página substitui o rótulo do último item;
  // os demais entram antes dele.
  let visibleItems = baseItems;
  if (extraCrumbs.length > 0 && baseItems.length > 0) {
    const last = baseItems[baseItems.length - 1];
    const override = extraCrumbs.find(
      (crumb) => crumb.pathname === last.pathname
    );
    const inserted = extraCrumbs.filter(
      (crumb) => crumb.pathname !== last.pathname
    );

    visibleItems = [
      ...baseItems.slice(0, -1),
      ...inserted.map((crumb) => ({
        routeId: `extra:${crumb.pathname}`,
        pathname: crumb.pathname,
        title: crumb.title,
      })),
      override ? { ...last, title: override.title } : last,
    ];
  }

  if (!visibleItems.length) {
    return null;
  }

  return (
    <BaseBreadCrumb>
      <BreadcrumbList>
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;

          return (
            <Fragment key={`${item.routeId}:${item.pathname}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={item.pathname}
                      search={getRememberedSearch(item.pathname)}
                    >
                      {item.title}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </BaseBreadCrumb>
  );
}
