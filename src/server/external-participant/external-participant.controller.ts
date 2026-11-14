// #region Imports
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard.js';
import { GroupMemberGuard } from '../guards/group-member.guard.js';
import {
  CreateExternalParticipantDto,
  ExternalParticipantDto,
  UpdateExternalParticipantDto,
} from './external-participant.dto.js';
import { ExternalParticipantService } from './external-participant.service.js';
import {
  CreateExternalParticipantSchema,
  UpdateExternalParticipantSchema,
} from './external-participant.schema.js';
// #endregion

// #region Controller
@ApiTags('external-participants')
@Controller('external-participants')
@UseGuards(AuthGuard, GroupMemberGuard)
export class ExternalParticipantsController {
  public constructor(
    private readonly participants: ExternalParticipantService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List reusable external participants' })
  @ApiOkResponse({ type: ExternalParticipantDto, isArray: true })
  public getParticipants(): Promise<ExternalParticipantDto[]> {
    return this.participants.getParticipants();
  }

  @Post()
  @ApiOperation({ summary: 'Create a reusable external participant' })
  @ApiCreatedResponse({ type: ExternalParticipantDto })
  public createParticipant(
    @Body() body: CreateExternalParticipantDto,
  ): Promise<ExternalParticipantDto> {
    const parsed = CreateExternalParticipantSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException('Enter a participant name');
    return this.participants.createParticipant(parsed.data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a reusable external participant' })
  @ApiOkResponse({ type: ExternalParticipantDto })
  public updateParticipant(
    @Param('id') id: string,
    @Body() body: UpdateExternalParticipantDto,
  ): Promise<ExternalParticipantDto> {
    const parsed = UpdateExternalParticipantSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException('Enter a participant name');
    return this.participants.updateParticipant(id, parsed.data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an unused external participant' })
  @ApiOkResponse({ type: ExternalParticipantDto })
  public deleteParticipant(
    @Param('id') id: string,
  ): Promise<ExternalParticipantDto> {
    return this.participants.deleteParticipant(id);
  }
}
// #endregion
