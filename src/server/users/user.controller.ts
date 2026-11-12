// #region Imports
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import { CreateUserDto, UserDto } from './user.dto.js';
import { UserService } from './user.service.js';
// #endregion

// #region Validation
const CreateUserSchema = z.object({ name: z.string().trim().min(1).max(100) });
// #endregion

// #region Controller
@ApiTags('users')
@Controller('users')
export class UserController {
  public constructor(private readonly service: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ type: UserDto, isArray: true })
  public getUsers(): Promise<UserDto[]> {
    return this.service.getUsers();
  }

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({ type: UserDto })
  public createUser(@Body() body: CreateUserDto): Promise<UserDto> {
    return this.service.createUser(validateUser(body));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({ type: UserDto })
  public updateUser(
    @Param('id') id: string,
    @Body() body: CreateUserDto,
  ): Promise<UserDto> {
    return this.service.updateUser(id, validateUser(body));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user not referenced by expenses' })
  @ApiOkResponse({ type: UserDto })
  public deleteUser(@Param('id') id: string): Promise<UserDto> {
    return this.service.deleteUser(id);
  }
}
// #endregion

// #region Helpers
function validateUser(body: CreateUserDto): CreateUserDto {
  const result = CreateUserSchema.safeParse(body);
  if (!result.success) throw new BadRequestException('Invalid user data');
  return result.data;
}
// #endregion
