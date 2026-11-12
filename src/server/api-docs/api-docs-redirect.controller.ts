// #region Imports
import { Controller, Get, HttpStatus, Redirect } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
// #endregion

// #region Controller
@Controller()
export class ApiDocsRedirectController {
  @Get()
  @ApiExcludeEndpoint()
  @Redirect('/api/docs', HttpStatus.FOUND)
  public redirectToDocs(): void {}
}
// #endregion
