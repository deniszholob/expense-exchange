// #region Imports
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
// #endregion

// #region Controller
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API availability' })
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  public getHealth(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
// #endregion
