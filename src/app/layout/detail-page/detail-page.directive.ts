import { Directive, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { filter, map, Observable, of, Subject, takeUntil, tap } from 'rxjs';
import { typedNullCheck } from 'src/app/utils';

export interface RouteParamsDetailsPage {
  id: string;
}

export interface RouteQueryParamsDetailsPage {
  filter: string;
}

export enum DetailsPageState {
  NO_PARAMS, // No Url parameters provided
  LOADING, // Loading Data
  LOADED_PARAM_DATA, // Data ready
  ERROR,
}

@Directive()
export abstract class DetailsPageDirective<T extends string | number = string>
  implements OnDestroy
{
  protected readonly clearSub$: Subject<void> = new Subject();
  protected readonly DetailsPageState = DetailsPageState;

  protected pageState: DetailsPageState = DetailsPageState.NO_PARAMS;
  protected params$: Observable<RouteParamsDetailsPage> = of();

  /**
   * can be either freeform string or enum string
   * if freeform string, then can also be comma delimited
   * e.g: "id1" from /path/id1
   * e.g: 1 from /path/1
   * e.g: "id1,id2,id3" from /path/id1,id2,id3
   */
  protected pageId?: T = undefined;
  protected errors: string[] = [];

  constructor() {
    this.pageState = DetailsPageState.LOADING;
  }

  /** Do some validation/filtering on params passed in to set proper page state */
  protected getRouteDetailId(
    activatedRoute: ActivatedRoute,
    router: Router,
    validateId: (id: string | number) => id is T,
  ): Observable<T> {
    return this.getRouteParams(activatedRoute).pipe(
      map((params: RouteParamsDetailsPage): T | undefined =>
        validateId(params.id) ? params.id : undefined,
      ),
      tap((pageId: T | undefined): void => {
        this.pageId = pageId;
        if (!pageId) {
          this.pageState = DetailsPageState.NO_PARAMS;
          // console.error(`Invalid Detail Page id: ${pageId}`);
          // if invalid param like "/route/erghaser" then go to "/route/" route
          // router.navigate(['..'], {
          //   relativeTo: activatedRoute,
          //   replaceUrl: true,
          // });
        }
      }),
      filter(typedNullCheck),
      takeUntil(this.clearSub$),
    );
  }

  protected getRouteParams(
    activatedRoute: ActivatedRoute,
  ): Observable<RouteParamsDetailsPage> {
    return activatedRoute.params.pipe(
      tap((params: Params): void => {
        this.pageState = checkRouteParams(params)
          ? DetailsPageState.LOADING
          : DetailsPageState.NO_PARAMS;

        this.pageId = undefined;
      }),
      filter(checkRouteParams),
    );
  }

  protected getRouteFilter<F extends string = string>(
    activatedRoute: ActivatedRoute,
    validateFilter: (filter: string) => filter is F,
  ): Observable<F | undefined> {
    return activatedRoute.queryParams.pipe(
      map((params: Params): F | undefined =>
        checkRouteQueryParams(params) && validateFilter(params.filter)
          ? params.filter
          : undefined,
      ),
      takeUntil(this.clearSub$),
    );
  }

  public ngOnDestroy(): void {
    this.clearSub$.next();
    this.clearSub$.complete();
  }
}

function checkRouteParams(
  params?: Partial<RouteParamsDetailsPage>,
): params is RouteParamsDetailsPage {
  if (!params?.id) return false;
  return true;
}

export function checkRouteQueryParams(
  params?: Partial<RouteQueryParamsDetailsPage>,
): params is RouteQueryParamsDetailsPage {
  if (!params?.filter) return false;
  return true;
}

export function validateIdEnum(id: string | number): id is string | number {
  return typeof id === 'string' || typeof id === 'number';
}

export function validateIdStringAny(id: string | number): id is string {
  return typeof id === 'string';
}

export function validateIdStringLength(id: string | number): id is string {
  return validateIdStringAny(id) && id.length > 0;
}
