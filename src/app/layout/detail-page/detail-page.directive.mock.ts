import { Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InputType } from '@storybook/types';
import { of } from 'rxjs';
import { ROUTE_KEYWORDS } from 'src/app/app.info';
import { DeepPartial } from 'src/app/utils';

import { RouteParamsDetailsPage } from './detail-page.directive';

export enum MockDetailsPageParamsEnum {
  None = 'None',
  NewId = 'New Id',
  ValidId = 'Valid Id',
  InvalidId = 'Invalid Id',
}

export type MockDetailsPageParamsEnumMap = Record<
  MockDetailsPageParamsEnum,
  Partial<RouteParamsDetailsPage>
>;

export function getMockRouteParamsDetailPage(
  id: string = 'test',
): MockDetailsPageParamsEnumMap {
  return {
    [MockDetailsPageParamsEnum.None]: {},
    [MockDetailsPageParamsEnum.NewId]: { id: ROUTE_KEYWORDS.NEW_ITEM },
    [MockDetailsPageParamsEnum.ValidId]: { id },
    [MockDetailsPageParamsEnum.InvalidId]: { id: 'invalid-id' },
  };
}

export function getMockActivatedRouteProvider(
  enumMap: MockDetailsPageParamsEnumMap,
  enumValue: MockDetailsPageParamsEnum,
  queryParams?: string,
): Provider {
  return {
    provide: ActivatedRoute,
    useValue: {
      params: of(enumMap[enumValue]),
      queryParams: of({ filter: queryParams }),
      snapshot: {
        params: enumMap[enumValue],
        queryParams: { filter: queryParams },
      },
    } satisfies DeepPartial<ActivatedRoute>,
  };
}

export type SbWithDetailsPageParamsControl = {
  routeParams: MockDetailsPageParamsEnum;
};

export const SB_InputMap_routeParams: InputType = {
  options: Object.values(MockDetailsPageParamsEnum),
  mapping: MockDetailsPageParamsEnum,
  control: { type: 'select' },
};
