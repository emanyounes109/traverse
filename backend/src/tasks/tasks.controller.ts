import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Permission, Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListMyTasksQueryDto, ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { ReviewTaskDto } from './dto/review-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

const submitBody = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: {
      file: { type: 'string', format: 'binary' },
      note: { type: 'string', maxLength: 1000 },
    },
  },
};

@ApiTags('Tasks')
@ApiCookieAuth()
@ApiForbiddenResponse({ description: 'FORBIDDEN' })
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_MANAGE_TASKS)
  @ApiOperation({ summary: 'Create a task for an ACTIVE internship in your scope' })
  @ApiCreatedResponse({ description: 'The task (status PENDING)' })
  @ApiBadRequestResponse({ description: 'VALIDATION_ERROR or DEADLINE_IN_PAST' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND (internship)' })
  @ApiConflictResponse({ description: 'INTERNSHIP_NOT_ACTIVE' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasks.create(user, dto);
  }

  @Get()
  @Roles(Role.STAFF)
  @ApiOperation({ summary: 'List tasks of the interns in your scope (staff)' })
  @ApiOkResponse({ description: '{ data, meta } with isOverdue' })
  @ApiBadRequestResponse({ description: 'VALIDATION_ERROR or INVALID_DATE_RANGE' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListTasksQueryDto) {
    return this.tasks.list(user, query);
  }

  @Get('me')
  @Roles(Role.INTERN)
  @ApiOperation({ summary: 'My tasks (intern)' })
  @ApiOkResponse({ description: '{ data, meta } with isOverdue' })
  listMine(@CurrentUser() user: AuthUser, @Query() query: ListMyTasksQueryDto) {
    return this.tasks.listMine(user, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Task details with latest submission and feedback (assigned intern or staff in scope)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Task + latestSubmission + feedback' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.getOne(user, id);
  }

  @Patch(':id')
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_MANAGE_TASKS)
  @ApiOperation({ summary: 'Edit title, description, deadline or priority' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated task' })
  @ApiBadRequestResponse({ description: 'VALIDATION_ERROR or DEADLINE_IN_PAST' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({ description: 'TASK_LOCKED' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(user, id, dto);
  }

  @Get(':id/submissions')
  @ApiOperation({ summary: 'All submissions, newest first (assigned intern or staff in scope)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Array of submissions with document metadata' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  submissions(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.listSubmissions(user, id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Task history, oldest first (assigned intern or staff in scope)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Array of history rows' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  history(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.history(user, id);
  }

  @Post(':id/start')
  @HttpCode(200)
  @Roles(Role.INTERN)
  @ApiOperation({ summary: 'Start the task (PENDING or CHANGES_REQUESTED -> IN_PROGRESS)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated task' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION or INTERNSHIP_CLOSED' })
  start(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.start(user, id);
  }

  @Post(':id/submit')
  @Roles(Role.INTERN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Submit a file (IN_PROGRESS) or replace it while SUBMITTED',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody(submitBody)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ description: 'The new submission version' })
  @ApiBadRequestResponse({ description: 'FILE_REQUIRED or INVALID_FILE_TYPE' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({
    description: 'SUBMISSION_NOT_ALLOWED or INTERNSHIP_CLOSED',
  })
  submit(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitTaskDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tasks.submit(user, id, dto, file);
  }

  @Post(':id/start-review')
  @HttpCode(200)
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_REVIEW_TASKS)
  @ApiOperation({ summary: 'Start reviewing (SUBMITTED -> UNDER_REVIEW)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated task' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION' })
  startReview(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasks.startReview(user, id);
  }

  @Patch(':id/review')
  @Roles(Role.STAFF)
  @Permissions(Permission.CAN_REVIEW_TASKS)
  @ApiOperation({ summary: 'Approve or request changes (task must be UNDER_REVIEW)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated task' })
  @ApiBadRequestResponse({ description: 'FEEDBACK_REQUIRED or VALIDATION_ERROR' })
  @ApiNotFoundResponse({ description: 'NOT_FOUND' })
  @ApiConflictResponse({ description: 'INVALID_TRANSITION or NO_SUBMISSION' })
  review(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewTaskDto,
  ) {
    return this.tasks.review(user, id, dto);
  }
}